package org.example.model.temporary;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class TemporaryStayContactEmbeddable {

    @Column(name = "contact_name")
    private String name;

    @Column(name = "contact_phone")
    private String phone;

    @Column(name = "contact_email")
    private String email;

    @Column(name = "contact_website")
    private String website;

    @Column(name = "contact_instagram")
    private String instagram;

    @Column(name = "contact_facebook")
    private String facebook;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getInstagram() {
        return instagram;
    }

    public void setInstagram(String instagram) {
        this.instagram = instagram;
    }

    public String getFacebook() {
        return facebook;
    }

    public void setFacebook(String facebook) {
        this.facebook = facebook;
    }
}
