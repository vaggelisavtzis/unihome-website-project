package org.example.dto.user;

import jakarta.validation.constraints.Size;

public class UpdateOwnerProfileRequest {

    @Size(max = 500)
    private String address;

    @Size(max = 20)
    private String vatNumber;

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getVatNumber() {
        return vatNumber;
    }

    public void setVatNumber(String vatNumber) {
        this.vatNumber = vatNumber;
    }
}
