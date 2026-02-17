package org.example.model.roommate;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class RoommateProfileEmbeddable {

    @Column(name = "profile_name")
    private String name;

    @Column(name = "profile_age")
    private Integer age;

    @Column(name = "profile_gender")
    private String gender;

    @Column(name = "profile_university")
    private String university;

    @Column(name = "profile_department")
    private String department;

    @Column(name = "profile_semester")
    private String semester;

    @Column(name = "profile_bio", length = 2000)
    private String bio;

    @Column(name = "profile_avatar")
    private String avatar;

    @Column(name = "profile_is_student")
    private Boolean student;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

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

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public Boolean getStudent() {
        return student;
    }

    public void setStudent(Boolean student) {
        this.student = student;
    }
}
