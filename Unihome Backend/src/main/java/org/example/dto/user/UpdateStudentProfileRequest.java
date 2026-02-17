package org.example.dto.user;

import jakarta.validation.constraints.Size;

public class UpdateStudentProfileRequest {

    @Size(max = 255)
    private String university;

    @Size(max = 255)
    private String department;

    @Size(max = 50)
    private String semester;

    private Boolean student;

    public String getUniversity() {
        return university;
    }

    public void setUniversity(String university) {
        this.university = university;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public Boolean getStudent() {
        return student;
    }

    public void setStudent(Boolean student) {
        this.student = student;
    }
}
