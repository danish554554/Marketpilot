from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUser
from app.schemas import (
    AuthResponse, AuthSession, LoginRequest, LogoutRequest, MessageResponse,
    PasswordResetEmailRequest, PasswordUpdateRequest, RegisterRequest, UserProfile,
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


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> AuthResponse:
    try:
        response = get_anon_client().auth.sign_up({
            "email": str(payload.email), "password": payload.password,
            "options": {"data": {"full_name": payload.full_name}},
        })
        if response.user is None:
            raise HTTPException(status_code=400, detail="Account could not be created.")
        profile = _profile_for(response.user.id)
        session = None if response.session is None else AuthSession(
            access_token=response.session.access_token, refresh_token=response.session.refresh_token,
            expires_in=response.session.expires_in, token_type=response.session.token_type,
        )
        message = "Account created. Check your email for verification code." if session is None else "Account created successfully."
        return AuthResponse(user=profile, session=session, message=message)
    except HTTPException:
        raise
    except Exception as exc:
        raise _auth_error(exc, "Unable to create account.") from exc


@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(payload: VerifyOtpRequest) -> AuthResponse:
    try:
        response = get_anon_client().auth.verify_otp({
            "email": str(payload.email),
            "token": payload.token,
            "type": payload.type,
        })
        if response.user is None:
            raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
        profile = _profile_for(response.user.id)
        session = None if response.session is None else AuthSession(
            access_token=response.session.access_token, refresh_token=response.session.refresh_token,
            expires_in=response.session.expires_in, token_type=response.session.token_type,
        )
        return AuthResponse(user=profile, session=session, message="Email verified successfully. You can now log in.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code. Please try again.") from exc


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
