package org.example.security;

import org.example.model.user.UserEntity;
import org.example.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        UserEntity user = resolveUser(identifier);
        return UserPrincipal.from(user);
    }

    private UserEntity resolveUser(String identifier) {
        return tryParseUuid(identifier)
            .flatMap(userRepository::findById)
            .orElseGet(() -> userRepository.findByEmail(identifier)
                .orElseThrow(() -> new UsernameNotFoundException("User not found")));
    }

    private Optional<UUID> tryParseUuid(String raw) {
        try {
            return Optional.of(UUID.fromString(raw));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
