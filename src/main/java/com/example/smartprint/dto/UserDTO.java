package com.example.smartprint.dto;

import com.example.smartprint.model.User;
import com.example.smartprint.model.User.Role;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private double balance;
    private Role role;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    public static UserDTO fromEntity(User user) {
        if (user == null) {
            return null;
        }
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setBalance(user.getBalance());
        dto.setRole(user.getRole());
        dto.setActive(user.isActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLastLogin(user.getLastLogin());
        return dto;
    }

    public User toEntity() {
        User user = new User();
        user.setId(this.id);
        user.setName(this.name);
        user.setEmail(this.email);
        user.setBalance(this.balance);
        user.setRole(this.role);
        user.setActive(this.active);
        user.setCreatedAt(this.createdAt);
        user.setLastLogin(this.lastLogin);
        return user;
    }
} 