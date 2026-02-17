package org.example.model.user;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class StudentProfileEmbeddable {

    @Column(name = "student_university")
    private String university;

    @Column(name = "student_department")
    private String department;

    @Column(name = "student_semester")
    private String semester;

    @Column(name = "student_is_student")
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
