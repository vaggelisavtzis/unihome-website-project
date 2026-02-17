package org.example.mapper;

import org.example.dto.user.OwnerProfileDto;
import org.example.dto.user.StudentProfileDto;
import org.example.dto.user.UpdateOwnerProfileRequest;
import org.example.dto.user.UpdateStudentProfileRequest;
import org.example.dto.user.UpdateUserRequest;
import org.example.dto.user.UserProfileResponse;
import org.example.dto.user.UserSummary;
import org.example.model.user.OwnerProfileEmbeddable;
import org.example.model.user.StudentProfileEmbeddable;
import org.example.model.user.UserEntity;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserSummary toSummary(UserEntity entity) {
        if (entity == null) {
            return null;
        }
        UserSummary dto = new UserSummary();
        dto.setId(entity.getId());
        dto.setEmail(entity.getEmail());
        dto.setFirstName(entity.getFirstName());
        dto.setLastName(entity.getLastName());
        dto.setPhone(entity.getPhone());
        dto.setRole(entity.getRole());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setAge(entity.getAge());
        return dto;
    }

    public UserProfileResponse toProfile(UserEntity entity) {
        if (entity == null) {
            return null;
        }
        UserProfileResponse response = new UserProfileResponse();
        response.setUser(toSummary(entity));
        if (entity.getStudentProfile() != null) {
            response.setStudentProfile(toStudentProfileDto(entity.getStudentProfile()));
        }
        if (entity.getOwnerProfile() != null) {
            response.setOwnerProfile(toOwnerProfileDto(entity.getOwnerProfile()));
        }
        return response;
    }

    public void apply(UpdateUserRequest request, UserEntity entity) {
        entity.setEmail(normalizeEmail(request.getEmail()));
        entity.setFirstName(normalize(request.getFirstName()));
        entity.setLastName(normalize(request.getLastName()));
        entity.setPhone(normalizePhone(request.getPhone()));
        entity.setAge(request.getAge());
    }

    public void apply(UpdateStudentProfileRequest request, UserEntity entity) {
        StudentProfileEmbeddable profile = entity.getStudentProfile();
        if (profile == null) {
            profile = new StudentProfileEmbeddable();
        }
        profile.setUniversity(request.getUniversity());
        profile.setDepartment(request.getDepartment());
        profile.setSemester(request.getSemester());
        profile.setStudent(request.getStudent());
        entity.setStudentProfile(profile);
    }

    public void apply(UpdateOwnerProfileRequest request, UserEntity entity) {
        OwnerProfileEmbeddable profile = entity.getOwnerProfile();
        if (profile == null) {
            profile = new OwnerProfileEmbeddable();
        }
        profile.setAddress(request.getAddress());
        profile.setVatNumber(request.getVatNumber());
        entity.setOwnerProfile(profile);
    }

    public StudentProfileDto toStudentProfileDto(StudentProfileEmbeddable profile) {
        if (profile == null) {
            return null;
        }
        StudentProfileDto dto = new StudentProfileDto();
        dto.setUniversity(profile.getUniversity());
        dto.setDepartment(profile.getDepartment());
        dto.setSemester(profile.getSemester());
        dto.setStudent(profile.getStudent());
        return dto;
    }

    public OwnerProfileDto toOwnerProfileDto(OwnerProfileEmbeddable profile) {
        if (profile == null) {
            return null;
        }
        OwnerProfileDto dto = new OwnerProfileDto();
        dto.setAddress(profile.getAddress());
        dto.setVatNumber(profile.getVatNumber());
        return dto;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        return value.trim();
    }

    private String normalizeEmail(String value) {
        if (value == null) {
            return null;
        }
        return value.trim().toLowerCase();
    }

    private String normalizePhone(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
