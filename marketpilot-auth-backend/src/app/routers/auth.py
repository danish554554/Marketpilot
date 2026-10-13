from fastapi import APIRouter, HTTPException, status, Request
import httpx
import os

from app.dependencies import CurrentUser
from app.schemas import (
    AuthResponse, AuthSession, LoginRequest, LogoutRequest, MessageResponse,
    PasswordResetEmailRequest, PasswordUpdateRequest, RegisterRequest, ResendOtpRequest, UserProfile,
    VerifyOtpRequest,
)
from app.supabase_client import get_anon_client, get_service_client

import threading

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _get_base_frontend_url(request: Request | None = None) -> str:
    """
    Returns the appropriate frontend URL (Vercel production or local).
    Defaults to live production https://marketpilot-iota.vercel.app so emails always work live.
    """
    from app.config import get_settings
    settings = get_settings()

    if request:
        origin = request.headers.get("origin") or request.headers.get("referer")
        if origin:
            clean_origin = origin.rstrip("/")
            if "://" in clean_origin:
                scheme_host = "/".join(clean_origin.split("/")[:3])
                if "localhost" in scheme_host or "127.0.0.1" in scheme_host:
                    return scheme_host
                if "vercel.app" in scheme_host or "marketpilot" in scheme_host:
                    return scheme_host

    if settings.environment.lower() == "production" or os.environ.get("RENDER"):
        return "https://marketpilot-iota.vercel.app"

    configured = str(settings.password_reset_redirect_url)
    if "vercel" in configured:
        return "https://marketpilot-iota.vercel.app"

    return "https://marketpilot-iota.vercel.app"


def _profile_for(
    user_id: str,
    fallback_email: str | None = None,
    fallback_name: str | None = None,
    fallback_meta: dict | None = None,
) -> UserProfile:
    service_client = get_service_client()
    try:
        result = service_client.table("profiles").select("id,email,full_name,avatar_url,role").eq("id", user_id).maybe_single().execute()
        if result and result.data:
            return UserProfile.model_validate(result.data)
    except Exception:
        pass

    # Instant non-blocking profile generation without sleeping
    clean_email = fallback_email or (f"user-{str(user_id)[:8]}@marketpilot.ai")
    meta = fallback_meta or {}
    clean_name = fallback_name or meta.get("full_name") or (clean_email.split("@")[0] if clean_email else "User")
    profile_data = {
        "id": user_id,
        "email": clean_email,
        "full_name": clean_name,
        "avatar_url": None,
        "role": "owner",
    }

    # Ensure profile row exists in database in background thread
    def _async_upsert():
        try:
            service_client.table("profiles").upsert(profile_data).execute()
        except Exception:
            pass

    threading.Thread(target=_async_upsert, daemon=True).start()
    return UserProfile.model_validate(profile_data)


def _auth_error(exc: Exception, fallback: str) -> HTTPException:
    text = str(exc).lower()
    if "invalid login credentials" in text:
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password.")
    if any(k in text for k in ["already registered", "already been registered", "unique constraint", "already exists", "pgrst116", "cannot coerce", "0 rows"]):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This email is already registered. Please log in with your password.")
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=fallback)


_OTP_CACHE: dict[str, dict] = {}


def _generate_otp(email: str, user_id: str | None = None) -> str:
    import datetime, random
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
    _OTP_CACHE[email.lower()] = {
        "code": code,
        "expires_at": expires_at,
        "user_id": user_id,
        "attempts": 0,
    }
    if user_id:
        try:
            admin = get_service_client().auth.admin
            user = admin.get_user_by_id(user_id)
            meta = user.user.user_metadata or {}
            meta["verification_otp"] = code
            meta["otp_expires_at"] = expires_at.isoformat()
            meta["is_verified"] = False
            admin.update_user_by_id(user_id, {"user_metadata": meta})
        except Exception:
            pass
    return code


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request) -> AuthResponse:
    try:
        email_clean = str(payload.email).strip().lower()
        biz_name = payload.business_name.strip() if payload.business_name and payload.business_name.strip() else payload.full_name
        target_country = payload.target_country.strip() if payload.target_country else "Pakistan"
        frontend_base = _get_base_frontend_url(request)
        
        # Determine initial country code and currency defaults
        country_code = "PK" if "pakistan" in target_country.lower() else "US"
        currency = "PKR" if "pakistan" in target_country.lower() else "USD"

        service_client = get_service_client()

        # 1. Proactively check if email is already registered in profiles
        try:
            existing_prof = service_client.table("profiles").select("id,email").eq("email", email_clean).maybe_single().execute()
            if existing_prof and existing_prof.data:
                is_user_verified = False
                existing_user_id = str(existing_prof.data.get("id"))
                try:
                    admin = service_client.auth.admin
                    sb_user = admin.get_user_by_id(existing_user_id)
                    if sb_user and sb_user.user:
                        meta = sb_user.user.user_metadata or {}
                        is_user_verified = bool(meta.get("is_verified", False))
                except Exception:
                    pass

                if is_user_verified:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="This email is already registered. Please log in with your password.",
                    )
                else:
                    # User registered previously but has not verified yet: update password and resend fresh OTP
                    try:
                        service_client.auth.admin.update_user_by_id(existing_user_id, {
                            "password": payload.password,
                            "user_metadata": {
                                "business_name": biz_name,
                                "full_name": payload.full_name,
                                "target_country": target_country,
                                "industry": payload.industry,
                                "is_verified": False,
                            }
                        })
                    except Exception:
                        pass

                    otp_code = _generate_otp(email_clean, existing_user_id)
                    action_link = None
                    try:
                        link_res = service_client.auth.admin.generate_link({
                            "type": "magiclink",
                            "email": email_clean,
                            "options": {"redirect_to": frontend_base}
                        })
                        if link_res and link_res.properties:
                            action_link = link_res.properties.action_link
                    except Exception:
                        pass

                    def _resend_unverified_bg():
                        try:
                            from app.services.email_service import send_verification_email
                            send_verification_email(
                                to_email=email_clean,
                                otp_code=otp_code,
                                business_name=biz_name,
                                action_link=action_link,
                            )
                        except Exception as e:
                            print(f"Notice: resend unverified error: {e}")

                    threading.Thread(target=_resend_unverified_bg, daemon=True).start()

                    profile = _profile_for(existing_user_id, fallback_email=email_clean, fallback_name=payload.full_name)
                    return AuthResponse(
                        user=profile,
                        session=None,
                        requires_verification=True,
                        verification_code=None,
                        message=f"A fresh verification code has been sent to {payload.email}. Please check your Gmail inbox.",
                    )
        except HTTPException:
            raise
        except Exception:
            pass

        response = None
        used_admin_fallback = False

        try:
            response = get_anon_client().auth.sign_up({
                "email": email_clean,
                "password": payload.password,
                "options": {
                    "email_redirect_to": frontend_base,
                    "data": {
                        "full_name": payload.full_name,
                        "business_name": biz_name,
                        "target_country": target_country,
                    },
                },
            })
        except Exception as signup_err:
            signup_err_text = str(signup_err).lower()
            if any(k in signup_err_text for k in ["already registered", "already been registered", "unique constraint"]):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This email is already registered. Please log in with your password.",
                )
            # Catch mail delivery errors, timeouts (httpx.ReadTimeout), rate limits, or SMTP crashes:
            print(f"Notice: Supabase sign_up failed or timed out ({signup_err}). Creating unconfirmed user via admin.")
            try:
                link_res = service_client.auth.admin.generate_link({
                    "type": "signup",
                    "email": email_clean,
                    "password": payload.password,
                    "options": {
                        "redirect_to": frontend_base,
                        "data": {
                            "full_name": payload.full_name,
                            "business_name": biz_name,
                            "target_country": target_country,
                        },
                    },
                })
                response = link_res
                used_admin_fallback = True
            except Exception as admin_err:
                admin_err_text = str(admin_err).lower()
                if any(k in admin_err_text for k in ["already registered", "already been registered", "unique constraint"]):
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="This email is already registered. Please log in with your password.",
                    )
                raise _auth_error(admin_err, "Unable to create account.") from admin_err

        if response is None or response.user is None:
            raise HTTPException(status_code=400, detail="Account could not be created.")

        # Supabase returns identities=[] when an email is already registered to avoid leaking user presence
        if hasattr(response.user, "identities") and response.user.identities is not None and len(response.user.identities) == 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is already registered. Please log in with your password.",
            )

        profile = _profile_for(response.user.id, fallback_email=email_clean, fallback_name=payload.full_name)
        profile.target_country = target_country

        # Provision full business workspace in database in background thread
        def _provision_workspace_task():
            try:
                ws_check = service_client.table("business_workspaces").select("id").eq("owner_id", response.user.id).maybe_single().execute()
                if not ws_check or not ws_check.data:
                    ws_res = service_client.table("business_workspaces").insert({
                        "owner_id": response.user.id,
                        "business_name": biz_name,
                        "business_description": f"{biz_name} e-commerce store catalogue and marketing workspace.",
                        "industry": "e-commerce",
                        "country": country_code,
                        "currency": currency,
                        "target_market": target_country,
                        "marketing_objectives": ["increase_sales", "increase_engagement"],
                    }).execute()
                    if ws_res.data and len(ws_res.data) > 0:
                        ws_id = ws_res.data[0]["id"]
                        try:
                            service_client.table("brand_kits").insert({
                                "workspace_id": ws_id,
                                "brand_voice": ["Authentic", "Engaging", "Professional"],
                                "prohibited_words": ["guaranteed 100%", "miracle cure", "cheap knockoff"],
                                "approved_cta_examples": ["Explore collection", "Shop now"],
                                "primary_color_hex": "#165823",
                            }).execute()
                        except Exception:
                            pass
            except Exception as ws_err:
                print(f"Notice: Workspace background provisioning: {ws_err}")

        threading.Thread(target=_provision_workspace_task, daemon=True).start()

        # Check if email confirmation is required by Supabase
        is_confirmed = getattr(response.user, "email_confirmed_at", None) is not None
        if not is_confirmed or response.session is None:
            # Generate 6-digit verification code instantly in memory
            otp_code = _generate_otp(email_clean, response.user.id if response and response.user else None)

            # Also cache Supabase GoTrue email_otp if present
            supa_otp = getattr(getattr(response, "properties", None), "email_otp", None)
            if supa_otp:
                supa_str = str(supa_otp).strip()
                if email_clean in _OTP_CACHE:
                    _OTP_CACHE[email_clean].setdefault("valid_tokens", []).append(supa_str)
                _OTP_CACHE[supa_str] = email_clean

            # Capture action link if already available
            action_link = getattr(getattr(response, "properties", None), "action_link", None)

            # Deliver email asynchronously in background thread so HTTP response returns in milliseconds
            def _send_email_background():
                nonlocal action_link
                if not action_link:
                    try:
                        fresh_link = service_client.auth.admin.generate_link({
                            "type": "signup",
                            "email": email_clean,
                            "password": payload.password,
                            "options": {"redirect_to": "https://marketpilot-iota.vercel.app"}
                        })
                        action_link = fresh_link.properties.action_link
                        if fresh_link.properties.email_otp:
                            f_otp = str(fresh_link.properties.email_otp).strip()
                            if email_clean in _OTP_CACHE:
                                _OTP_CACHE[email_clean].setdefault("valid_tokens", []).append(f_otp)
                            _OTP_CACHE[f_otp] = email_clean
                    except Exception:
                        pass

                try:
                    from app.services.email_service import send_verification_email
                    send_verification_email(
                        to_email=email_clean,
                        otp_code=otp_code,
                        business_name=biz_name,
                        action_link=action_link,
                    )
                    print(f"Verification code {otp_code} dispatched to {email_clean} via Google SMTP (background)")
                except Exception as email_err:
                    print(f"Notice: Direct email delivery error: {email_err}")

            threading.Thread(target=_send_email_background, daemon=True).start()

            return AuthResponse(
                user=profile,
                session=None,
                requires_verification=True,
                verification_code=None,
                message=f"A verification code has been sent to {payload.email}. Please check your Gmail inbox.",
            )

        # Only if already confirmed
        session = AuthSession(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            expires_in=response.session.expires_in,
            token_type=response.session.token_type,
        )
        return AuthResponse(
            user=profile,
            session=session,
            requires_verification=False,
            verification_code=None,
            message="Account created successfully! Welcome to MarketPilot.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _auth_error(exc, "Unable to create account.") from exc


@router.post("/resend-otp", response_model=MessageResponse)
def resend_otp(payload: ResendOtpRequest, request: Request) -> MessageResponse:
    email_clean = str(payload.email).strip().lower()
    service_client = get_service_client()
    user_id = None
    biz_name = "MarketPilot AI"
    frontend_base = _get_base_frontend_url(request)
    try:
        users = service_client.auth.admin.list_users()
        matching_user = next((u for u in users if u.email and u.email.lower() == email_clean), None)
        if matching_user:
            user_id = str(matching_user.id)
            meta = matching_user.user_metadata or {}
            biz_name = meta.get("business_name") or "MarketPilot AI"
    except Exception:
        pass

    otp_code = _generate_otp(email_clean, user_id)

    # Generate fresh official Supabase verification link
    action_link = None
    try:
        link_res = service_client.auth.admin.generate_link({
            "type": "magiclink",
            "email": email_clean,
            "options": {"redirect_to": frontend_base}
        })
        if link_res and link_res.properties:
            action_link = link_res.properties.action_link
            if link_res.properties.email_otp:
                f_otp = str(link_res.properties.email_otp).strip()
                if email_clean in _OTP_CACHE:
                    _OTP_CACHE[email_clean].setdefault("valid_tokens", []).append(f_otp)
                _OTP_CACHE[f_otp] = email_clean
    except Exception as e:
        print(f"Notice: Admin generate_link on resend: {e}")

    # Dispatch ONE comprehensive email with both OTP code and auto-confirm button
    def _send_resend_email():
        try:
            from app.services.email_service import send_verification_email
            send_verification_email(
                to_email=email_clean,
                otp_code=otp_code,
                business_name=biz_name,
                action_link=action_link,
            )
            print(f"Resend OTP {otp_code} dispatched to {email_clean} via Gmail SMTP")
        except Exception as email_err:
            print(f"Notice: Direct email delivery on resend: {email_err}")

    threading.Thread(target=_send_resend_email, daemon=True).start()

    return MessageResponse(
        message=f"A fresh verification code was sent to {payload.email}. Please check your Gmail inbox.",
        verification_code=None,
    )


@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(payload: VerifyOtpRequest) -> AuthResponse:
    email_clean = str(payload.email).strip().lower()
    token = str(payload.token).strip().replace("-", "").replace(" ", "")
    is_valid = False
    user_id = None
    service_client = get_service_client()

    # 1. Check in-memory OTP cache
    cached = _OTP_CACHE.get(email_clean)
    if cached:
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc)
        if cached.get("expires_at") and cached["expires_at"] > now:
            valid_codes = [cached.get("code")] + cached.get("valid_tokens", [])
            if token in [str(c).strip() for c in valid_codes if c]:
                is_valid = True
                user_id = cached.get("user_id")

    # 1b. Check direct token key mapping in _OTP_CACHE
    if not is_valid and token in _OTP_CACHE:
        val = _OTP_CACHE[token]
        if isinstance(val, str) and val in _OTP_CACHE:
            parent = _OTP_CACHE[val]
            import datetime
            if parent.get("expires_at") and parent["expires_at"] > datetime.datetime.now(datetime.timezone.utc):
                is_valid = True
                user_id = parent.get("user_id")

    # 2. Check Supabase user_metadata if not validated via cache
    if not is_valid:
        try:
            users = service_client.auth.admin.list_users()
            matching_user = next((u for u in users if u.email and u.email.lower() == email_clean), None)
            if matching_user:
                meta = matching_user.user_metadata or {}
                if meta.get("verification_otp") == token:
                    import datetime
                    exp_str = meta.get("otp_expires_at")
                    if exp_str:
                        exp_dt = datetime.datetime.fromisoformat(exp_str)
                        if exp_dt > datetime.datetime.now(datetime.timezone.utc):
                            is_valid = True
                            user_id = str(matching_user.id)
        except Exception:
            pass

    # 3. Fallback check via Supabase GoTrue verify_otp
    if not is_valid:
        for v_type in ["magiclink", "signup", "email"]:
            try:
                supa_res = get_anon_client().auth.verify_otp({
                    "email": email_clean,
                    "token": token,
                    "type": v_type,
                })
                if supa_res.user is not None:
                    is_valid = True
                    user_id = str(supa_res.user.id)
                    if supa_res.session:
                        profile = _profile_for(supa_res.user.id, fallback_email=email_clean, fallback_meta=supa_res.user.user_metadata)
                        session = AuthSession(
                            access_token=supa_res.session.access_token,
                            refresh_token=supa_res.session.refresh_token,
                            expires_in=supa_res.session.expires_in,
                            token_type=supa_res.session.token_type,
                        )
                        return AuthResponse(
                            user=profile,
                            session=session,
                            message="Email verified successfully. Welcome to MarketPilot!",
                            requires_verification=False,
                        )
                    break
            except Exception:
                continue

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check your email or click Resend Code.",
        )

    # Mark user as verified in Supabase in background
    if user_id:
        def _confirm_user_async():
            try:
                service_client.auth.admin.update_user_by_id(user_id, {
                    "email_confirm": True,
                    "user_metadata": {"is_verified": True, "verification_otp": None},
                })
            except Exception:
                pass
        threading.Thread(target=_confirm_user_async, daemon=True).start()

    # Clear used OTP from cache
    if email_clean in _OTP_CACHE:
        del _OTP_CACHE[email_clean]

    # Generate an active Supabase session for the verified user
    try:
        link_res = service_client.auth.admin.generate_link({"type": "magiclink", "email": email_clean})
        if link_res and link_res.properties and link_res.properties.action_link:
            import urllib.parse
            resp = httpx.get(link_res.properties.action_link, follow_redirects=False, timeout=8)
            loc = resp.headers.get("location") or ""
            if "#" in loc:
                fragment = loc.split("#", 1)[1]
                q_params = urllib.parse.parse_qs(fragment)
                acc_tok = q_params.get("access_token", [None])[0]
                ref_tok = q_params.get("refresh_token", [None])[0]
                exp_in = int(q_params.get("expires_in", [3600])[0])
                tok_type = q_params.get("token_type", ["bearer"])[0]
                if acc_tok:
                    profile = _profile_for(user_id or email_clean, fallback_email=email_clean)
                    session = AuthSession(
                        access_token=acc_tok,
                        refresh_token=ref_tok or acc_tok,
                        expires_in=exp_in,
                        token_type=tok_type,
                    )
                    return AuthResponse(
                        user=profile,
                        session=session,
                        message="Email verified successfully. Welcome to MarketPilot!",
                        requires_verification=False,
                    )
    except Exception as exc:
        print(f"Notice: Magiclink session generation: {exc}")

    # Fallback profile if session couldn't be generated via magiclink
    profile = _profile_for(user_id or email_clean, fallback_email=email_clean)

    return AuthResponse(
        user=profile,
        session=None,
        message="Email verified successfully! You can now log in.",
        requires_verification=False,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    try:
        response = get_anon_client().auth.sign_in_with_password({"email": str(payload.email), "password": payload.password})
        if response.user is None or response.session is None:
            raise HTTPException(status_code=401, detail="Incorrect email or password.")
        
        user_meta = response.user.user_metadata or {}
        profile = _profile_for(
            response.user.id,
            fallback_email=response.user.email,
            fallback_name=user_meta.get("full_name"),
            fallback_meta=user_meta,
        )
        return AuthResponse(
            user=profile,
            session=AuthSession(access_token=response.session.access_token, refresh_token=response.session.refresh_token,
                                expires_in=response.session.expires_in, token_type=response.session.token_type),
            message="Login successful.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _auth_error(exc, "Unable to sign in.") from exc


@router.post("/password-reset", response_model=MessageResponse)
def request_password_reset(payload: PasswordResetEmailRequest, request: Request) -> MessageResponse:
    email_clean = str(payload.email).strip().lower()
    try:
        from app.config import get_settings
        frontend_base = _get_base_frontend_url(request)
        redirect_url = payload.redirect_url or f"{frontend_base}/reset-password"
        service_client = get_service_client()
        link_res = service_client.auth.admin.generate_link({
            "type": "recovery",
            "email": email_clean,
            "options": {"redirect_to": redirect_url}
        })
        if link_res and link_res.properties and link_res.properties.action_link:
            action_link = link_res.properties.action_link
            def _send_reset_email_bg():
                try:
                    from app.services.email_service import send_password_reset_email
                    send_password_reset_email(email_clean, action_link)
                except Exception as e:
                    print(f"Notice: direct password reset email error: {e}")
            threading.Thread(target=_send_reset_email_bg, daemon=True).start()
    except Exception as exc:
        print(f"Notice: Password reset link generation error: {exc}")
        try:
            from app.config import get_settings
            frontend_base = _get_base_frontend_url(request)
            fallback_url = payload.redirect_url or f"{frontend_base}/reset-password"
            get_anon_client().auth.reset_password_for_email(
                email_clean,
                {"redirect_to": fallback_url}
            )
        except Exception:
            pass
    return MessageResponse(message="If that email belongs to an account, a password-reset link has been sent.")


@router.put("/password", response_model=MessageResponse)
def update_password(payload: PasswordUpdateRequest, current_user: CurrentUser) -> MessageResponse:
    try:
        get_service_client().auth.admin.update_user_by_id(str(current_user.id), {"password": payload.new_password})
        return MessageResponse(message="Password updated successfully.")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to update password.") from exc


@router.post("/logout", response_model=MessageResponse)
def logout(payload: LogoutRequest, current_user: CurrentUser) -> MessageResponse:
    try:
        client = get_anon_client()
        client.auth.set_session(payload.access_token, payload.refresh_token)
        client.auth.sign_out()
        return MessageResponse(message="Logged out successfully.")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to end this session. Discard the tokens on the client.") from exc


@router.delete("/account", response_model=MessageResponse)
def delete_account(current_user: CurrentUser) -> MessageResponse:
    try:
        get_service_client().auth.admin.delete_user(str(current_user.id))
        return MessageResponse(message="Your account has been deleted.")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to delete account.") from exc
