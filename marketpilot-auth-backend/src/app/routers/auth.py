from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUser
from app.schemas import (
    AuthResponse, AuthSession, LoginRequest, LogoutRequest, MessageResponse,
    PasswordResetEmailRequest, PasswordUpdateRequest, RegisterRequest, ResendOtpRequest, UserProfile,
    VerifyOtpRequest,
)
from app.supabase_client import get_anon_client, get_service_client

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _profile_for(user_id: str) -> UserProfile:
    result = get_service_client().table("profiles").select("id,email,full_name,avatar_url,role").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="The user profile was not created. Check the Supabase database trigger.")
    return UserProfile.model_validate(result.data)


def _auth_error(exc: Exception, fallback: str) -> HTTPException:
    text = str(exc).lower()
    if "invalid login credentials" in text:
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password.")
    if "already registered" in text or "already been registered" in text:
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")
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
def register(payload: RegisterRequest) -> AuthResponse:
    try:
        biz_name = payload.business_name.strip() if payload.business_name and payload.business_name.strip() else payload.full_name
        target_country = payload.target_country.strip() if payload.target_country else "Pakistan"
        
        # Determine initial country code and currency defaults
        country_code = "PK" if "pakistan" in target_country.lower() else "US"
        currency = "PKR" if "pakistan" in target_country.lower() else "USD"

        response = get_anon_client().auth.sign_up({
            "email": str(payload.email), "password": payload.password,
            "options": {"data": {
                "full_name": payload.full_name,
                "business_name": biz_name,
                "target_country": target_country,
            }},
        })
        if response.user is None:
            raise HTTPException(status_code=400, detail="Account could not be created.")

        profile = _profile_for(response.user.id)
        profile.target_country = target_country

        # Provision full business workspace in database with target country
        try:
            service_client = get_service_client()
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
            print(f"Notice: Workspace auto-provisioning handled: {ws_err}")

        # Ensure an active session is returned immediately for seamless onboarding
        session = None
        if response.session is not None:
            session = AuthSession(
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
                expires_in=response.session.expires_in,
                token_type=response.session.token_type,
            )
        else:
            try:
                # Auto-confirm user via service admin role and sign in
                service_client.auth.admin.update_user_by_id(str(response.user.id), {
                    "email_confirm": True,
                    "user_metadata": {
                        "is_verified": True,
                        "business_name": biz_name,
                        "target_country": target_country,
                    },
                })
                login_res = get_anon_client().auth.sign_in_with_password({
                    "email": str(payload.email),
                    "password": payload.password,
                })
                if login_res.session:
                    session = AuthSession(
                        access_token=login_res.session.access_token,
                        refresh_token=login_res.session.refresh_token,
                        expires_in=login_res.session.expires_in,
                        token_type=login_res.session.token_type,
                    )
            except Exception as sess_err:
                print(f"Notice: Auto-session generation fallback: {sess_err}")

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
def resend_otp(payload: ResendOtpRequest) -> MessageResponse:
    email_clean = str(payload.email).lower()
    service_client = get_service_client()
    user_id = None
    try:
        users = service_client.auth.admin.list_users()
        matching_user = next((u for u in users if u.email and u.email.lower() == email_clean), None)
        if matching_user:
            user_id = str(matching_user.id)
    except Exception:
        pass

    otp_code = _generate_otp(email_clean, user_id)

    # Send direct verification email if SMTP is configured
    try:
        from app.services.email_service import send_verification_email
        send_verification_email(email_clean, otp_code)
    except Exception as email_err:
        print(f"Notice: Direct email delivery on resend: {email_err}")

    # Attempt Supabase email delivery
    try:
        get_anon_client().auth.sign_in_with_otp({"email": email_clean})
    except Exception:
        try:
            get_anon_client().auth.resend({"type": "signup", "email": email_clean})
        except Exception:
            pass

    return MessageResponse(
        message=f"A fresh verification code was sent to {payload.email}. Please check your Gmail inbox and spam folder.",
        verification_code=None,
    )


@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(payload: VerifyOtpRequest) -> AuthResponse:
    email_clean = str(payload.email).lower()
    token = str(payload.token).strip()
    is_valid = False
    user_id = None
    service_client = get_service_client()

    # 1. Check in-memory OTP cache
    cached = _OTP_CACHE.get(email_clean)
    if cached:
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc)
        if cached.get("expires_at") and cached["expires_at"] > now:
            if cached.get("code") == token:
                is_valid = True
                user_id = cached.get("user_id")

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
                        profile = _profile_for(supa_res.user.id)
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

    # Mark user as verified in Supabase
    if user_id:
        try:
            service_client.auth.admin.update_user_by_id(user_id, {
                "email_confirm": True,
                "user_metadata": {"is_verified": True, "verification_otp": None},
            })
        except Exception:
            pass

    # Clear used OTP from cache
    if email_clean in _OTP_CACHE:
        del _OTP_CACHE[email_clean]

    # Generate an active Supabase session for the verified user
    try:
        link_res = service_client.auth.admin.generate_link({"type": "magiclink", "email": email_clean})
        supa_otp = link_res.properties.email_otp
        verify_res = get_anon_client().auth.verify_otp({
            "email": email_clean,
            "token": supa_otp,
            "type": "magiclink",
        })
        if verify_res.session:
            profile = _profile_for(verify_res.user.id)
            session = AuthSession(
                access_token=verify_res.session.access_token,
                refresh_token=verify_res.session.refresh_token,
                expires_in=verify_res.session.expires_in,
                token_type=verify_res.session.token_type,
            )
            return AuthResponse(
                user=profile,
                session=session,
                message="Email verified successfully. Welcome to MarketPilot!",
                requires_verification=False,
            )
    except Exception as exc:
        print(f"Notice: Magiclink session generation fallback: {exc}")

    # Fallback profile if session couldn't be generated via magiclink
    if user_id:
        profile = _profile_for(user_id)
    else:
        profile = _profile_for(email_clean)

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
        return AuthResponse(
            user=_profile_for(response.user.id),
            session=AuthSession(access_token=response.session.access_token, refresh_token=response.session.refresh_token,
                                expires_in=response.session.expires_in, token_type=response.session.token_type),
            message="Login successful.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _auth_error(exc, "Unable to sign in.") from exc


@router.post("/password-reset", response_model=MessageResponse)
def request_password_reset(payload: PasswordResetEmailRequest) -> MessageResponse:
    # Deliberately return the same response for every address to avoid account enumeration.
    try:
        from app.config import get_settings
        get_anon_client().auth.reset_password_for_email(str(payload.email), {"redirect_to": str(get_settings().password_reset_redirect_url)})
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
