package org.example.dto.user;

public class UserProfileResponse {

    private UserSummary user;
    private StudentProfileDto studentProfile;
    private OwnerProfileDto ownerProfile;

    public UserSummary getUser() {
        return user;
    }

    public void setUser(UserSummary user) {
        this.user = user;
    }

    public StudentProfileDto getStudentProfile() {
        return studentProfile;
    }

    public void setStudentProfile(StudentProfileDto studentProfile) {
        this.studentProfile = studentProfile;
    }

    public OwnerProfileDto getOwnerProfile() {
        return ownerProfile;
    }

    public void setOwnerProfile(OwnerProfileDto ownerProfile) {
        this.ownerProfile = ownerProfile;
    }
}
