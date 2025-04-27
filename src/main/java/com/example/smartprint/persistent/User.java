package com.example.smartprint.persistent;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.smartprint.persistent.Printer;

import java.util.Collection;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    public void setId(Long id) {
        this.id = id;
    }

    public void setPrinters(List<Printer> printers) {
        this.printers = printers;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPrintJobs(List<PrintJob> printJobs) {
        this.printJobs = printJobs;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // This maps to Printer.owner
    @OneToMany(mappedBy = "owner") // Must match the field name in Printer
    private List<Printer> printers;
    private String name;
    @Column(unique = true)
    private String email;

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    private String password;
    @OneToMany(mappedBy = "user")
    private List<PrintJob> printJobs;
    @Enumerated(EnumType.STRING)
    private UserRole role;

    public UserRole getRole() {
        return role;
    }



    public String getName() { return name; }



}

