package com.campus.booking.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<SecurityUser> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SecurityUser user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    public static Long getCurrentUserId() {
        return getCurrentUser()
                .map(SecurityUser::getId)
                .orElseThrow(() -> new IllegalStateException("No authenticated user in context"));
    }

    public static String getCurrentUserEmail() {
        return getCurrentUser()
                .map(SecurityUser::getEmail)
                .orElse("anonymous");
    }
}
