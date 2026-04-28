from django.contrib.auth import get_user_model
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes

from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    LoginSerializer, 
    TokenRefreshSerializer,
    LogoutSerializer
)
from .services import AuthService

User = get_user_model()

class RegisterView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        print(f"🔍 DEBUG: Received registration data: {request.data}")
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Remove password_confirm before passing to service
                validated_data = serializer.validated_data.copy()
                validated_data.pop('password_confirm', None)
                
                user, tokens = AuthService.register_user(**validated_data)
                return Response({
                    "user": UserSerializer(user).data,
                    "tokens": tokens,
                    "message": "User registered successfully"
                }, status=status.HTTP_201_CREATED)
            except ValueError as e:
                # Handle both string and dict errors
                if isinstance(e.args[0], dict):
                    return Response(e.args[0], status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            print(f"❌ DEBUG: Serializer errors: {serializer.errors}")
            # Return errors in consistent format
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        print(f"LOGIN DEBUG: Received login request with data: {request.data}")
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            print(f"LOGIN DEBUG: Serializer validated successfully: {serializer.validated_data}")
            try:
                user, tokens = AuthService.login_user(**serializer.validated_data)
                print(f"LOGIN DEBUG: Login successful for user: {user.username}")
                return Response({
                    "user": UserSerializer(user).data,
                    "tokens": tokens,
                    "message": "Login successful"
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                print(f"LOGIN DEBUG: Login failed with ValueError: {str(e)}")
                return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            print(f"LOGIN DEBUG: Serializer validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TokenRefreshView(APIView):
    """Token refresh endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        if serializer.is_valid():
            try:
                tokens = AuthService.refresh_token(**serializer.validated_data)
                return Response(tokens, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            try:
                AuthService.logout_user(**serializer.validated_data)
                return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    """User profile endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user profile"""
        profile = AuthService.get_user_profile(request.user)
        return Response(profile, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update user profile"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Legacy view for backward compatibility
class MeView(ProfileView):
    """Legacy MeView - use ProfileView instead"""
    pass
