package com.example.smartprint.controller;

import com.example.smartprint.model.Orientation;
import com.example.smartprint.model.PageSize;
import com.example.smartprint.model.PrintJob;
import com.example.smartprint.model.PrintJobStatus;
import com.example.smartprint.model.Printer;
import com.example.smartprint.model.PrinterStatus;
import com.example.smartprint.model.User;
import com.example.smartprint.model.UserRole;
import com.example.smartprint.repository.PrintJobRepository;
import com.example.smartprint.repository.PrinterRepository;
import com.example.smartprint.repository.UserRepository;
import com.example.smartprint.service.UserService;
import com.example.smartprint.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.web.bind.annotation.PathVariable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Controller
public class WebController {

    private final UserService userService;
    private final PrinterRepository printerRepository;
    private final PrintJobRepository printJobRepository;
    private final JwtUtils jwtUtils;
    private static final Logger logger = LoggerFactory.getLogger(WebController.class);

    @Autowired
    public WebController(UserService userService, PrinterRepository printerRepository, 
                         PrintJobRepository printJobRepository, JwtUtils jwtUtils) {
        this.userService = userService;
        this.printerRepository = printerRepository;
        this.printJobRepository = printJobRepository;
        this.jwtUtils = jwtUtils;
    }

    /**
     * Add authentication information to all models
     * This method will be called for all controller methods
     */
    @ModelAttribute
    public void addAuthenticationToModel(Model model) {
        // Get current authentication from security context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            model.addAttribute("authenticated", true);
            model.addAttribute("currentUser", auth.getName());
            
            if (auth.getAuthorities() != null && !auth.getAuthorities().isEmpty()) {
                String role = auth.getAuthorities().iterator().next().getAuthority();
                model.addAttribute("userRole", role);
                model.addAttribute("isAdmin", role.contains("ADMIN"));
            }
            
            try {
                // Try to get the full user object if available
                User user = userService.getUserFromToken("Bearer " + jwtUtils.generateToken(auth.getName()));
                if (user != null) {
                    model.addAttribute("user", user);
                }
            } catch (Exception e) {
                logger.warn("Could not load full user object for model: " + e.getMessage());
            }
        } else {
            model.addAttribute("authenticated", false);
        }
    }

    // Main pages
    @GetMapping("/")
    public String index(Model model) {
        // Get some basic stats to display on the homepage
        List<Printer> allPrinters = printerRepository.findAll();
        long printerCount = allPrinters.size();
        List<Printer> activePrinters = printerRepository.findByStatus(PrinterStatus.ONLINE);
        
        // Get unique locations for the location filter
        List<String> locations = allPrinters.stream()
                .map(Printer::getLocation)
                .distinct()
                .collect(Collectors.toList());
        
        // Filter out printers with null owners to prevent Thymeleaf errors
        List<Printer> onlinePrintersWithOwners = activePrinters.stream()
                .filter(printer -> printer.getOwner() != null)
                .collect(Collectors.toList());
        
        // Add attributes to the model
        model.addAttribute("printerCount", printerCount);
        model.addAttribute("activePrinters", activePrinters.size());
        model.addAttribute("printers", onlinePrintersWithOwners);  // Only show online printers with valid owners
        model.addAttribute("locations", locations);
        model.addAttribute("activePage", "home");
        
        return "index";
    }

    @GetMapping("/login")
    public String login(Model model) {
        model.addAttribute("activePage", "login");
        return "login";
    }

    @GetMapping("/signup")
    public String signup(Model model) {
        model.addAttribute("activePage", "signup");
        model.addAttribute("user", new User());
        return "signup";
    }

    @GetMapping("/dashboard")
    public String dashboardRedirect() {
        return "redirect:/";
    }

    @GetMapping("/profile")
    public String profile(Model model, Authentication authentication) {
        try {
            // Get the current user from authentication
            User currentUser = userService.getUserFromToken("Bearer " + jwtUtils.generateToken(authentication.getName()));
            model.addAttribute("user", currentUser);
            
            // Get recent print jobs for the user
            List<PrintJob> recentJobs = printJobRepository.findByUser(currentUser);
            model.addAttribute("recentJobs", recentJobs);
            model.addAttribute("activePage", "profile");
            
            return "profile";
        } catch (Exception e) {
            logger.error("Error loading profile page: {}", e.getMessage(), e);
            return "redirect:/login?error=profile_error";
        }
    }

    @GetMapping("/printing")
    public String printing(Model model) {
        model.addAttribute("activePage", "printing");
        
        // Get available printers
        List<Printer> availablePrinters = printerRepository.findByStatus(PrinterStatus.ONLINE);
        model.addAttribute("printers", availablePrinters);
        
        // Add print job object for form binding
        PrintJob printJob = new PrintJob();
        printJob.setPageSize(PageSize.A4); // Set default page size to A4
        printJob.setOrientation(Orientation.PORTRAIT); // Set default orientation to PORTRAIT
        model.addAttribute("printJob", printJob);
        
        return "printing";
    }

    // Printer management pages
    @GetMapping("/printers")
    public String printers(Model model, Authentication authentication) {
        // Get all printers to display in the UI
        List<Printer> allPrinters;
        
        // If user is admin, show all printers, otherwise show only user's printers
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            allPrinters = printerRepository.findAll();
        } else {
            User currentUser = userService.getUserFromToken("Bearer " + jwtUtils.generateToken(authentication.getName()));
            allPrinters = printerRepository.findByOwner(currentUser);
        }
        
        model.addAttribute("printers", allPrinters);
        model.addAttribute("activePage", "printers");
        return "printers";
    }

    @GetMapping("/printers/{id}")
    public String printerDetails(Model model) {
        model.addAttribute("activePage", "printers");
        return "printer-details";
    }

    // Print job management pages
    @GetMapping("/jobs")
    public String jobs(Model model) {
        model.addAttribute("activePage", "jobs");
        return "jobs";
    }

    @GetMapping("/jobs/{id}")
    public String jobDetails(Model model) {
        model.addAttribute("activePage", "jobs");
        return "job-details";
    }

    // User management pages
    @GetMapping("/users")
    public String users(Model model) {
        model.addAttribute("activePage", "users");
        return "users";
    }

    @GetMapping("/users/{id}")
    public String userDetails(Model model) {
        model.addAttribute("activePage", "users");
        return "user-details";
    }

    // Settings pages
    @GetMapping("/settings")
    public String settings(Model model) {
        model.addAttribute("activePage", "settings");
        return "settings";
    }

    @GetMapping("/settings/profile")
    public String profileSettings(Model model) {
        model.addAttribute("activePage", "settings");
        return "profile-settings";
    }

    @GetMapping("/security-settings")
    public String securitySettings(Model model) {
        model.addAttribute("activePage", "settings");
        return "security-settings";
    }

    @GetMapping("/admin")
    public String adminDashboard(Model model, Authentication authentication) {
        try {
            // Verify admin role
            if (!authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return "redirect:/dashboard?error=unauthorized";
            }
            
            // Get user count
            long totalUsers = userService.countUsers();
            model.addAttribute("totalUsers", totalUsers);
            
            // Get active printers count
            List<Printer> activePrinters = printerRepository.findByStatus(PrinterStatus.ONLINE);
            model.addAttribute("activePrinters", activePrinters.size());
            model.addAttribute("printers", printerRepository.findAll());
            
            // Get jobs completed today
            long jobsToday = printJobRepository.countByCreatedAtAfter(LocalDateTime.now().toLocalDate().atStartOfDay());
            model.addAttribute("jobsToday", jobsToday);
            
            // Get total revenue (sum of all completed print jobs)
            double totalRevenue = printJobRepository.findByStatus(PrintJobStatus.COMPLETED)
                    .stream()
                    .mapToDouble(PrintJob::getTotalCost)
                    .sum();
            model.addAttribute("totalRevenue", totalRevenue);
            
            // Get recent users (limit to 5)
            List<User> recentUsers = userService.getRecentUsers(5);
            model.addAttribute("recentUsers", recentUsers);
            
            // Get recent print jobs (limit to 5)
            List<PrintJob> recentJobs = printJobRepository.findTop5ByOrderByCreatedAtDesc();
            model.addAttribute("recentJobs", recentJobs);
            
            model.addAttribute("activePage", "admin");
            return "admin-dashboard";
        } catch (Exception e) {
            return "redirect:/dashboard?error=admin_error";
        }
    }

    // Admin section pages
    @GetMapping("/admin/users")
    public String adminUsers(Model model, Authentication authentication) {
        try {
            // Get all users for the admin
            List<User> allUsers = userService.getAllUsers();
            model.addAttribute("users", allUsers);
            model.addAttribute("activePage", "admin");
            model.addAttribute("activeAdminSection", "users");
            return "admin/users";
        } catch (Exception e) {
            logger.error("Error loading admin users page: {}", e.getMessage(), e);
            return "redirect:/admin?error=user_load_error";
        }
    }
    
    @GetMapping("/admin/printers")
    public String adminPrinters(Model model) {
        try {
            // Get all printers regardless of owner for admin view
            List<Printer> allPrinters = printerRepository.findAll();
            model.addAttribute("printers", allPrinters);
            model.addAttribute("activePage", "admin");
            model.addAttribute("activeAdminSection", "printers");
            return "admin/printers";
        } catch (Exception e) {
            logger.error("Error loading admin printers page: {}", e.getMessage(), e);
            return "redirect:/admin?error=printer_load_error";
        }
    }
    
    @GetMapping("/admin/jobs")
    public String adminJobs(Model model) {
        try {
            // Get all print jobs for admin
            List<PrintJob> allJobs = printJobRepository.findAll();
            model.addAttribute("printJobs", allJobs);
            model.addAttribute("activePage", "admin");
            model.addAttribute("activeAdminSection", "jobs");
            return "admin/jobs";
        } catch (Exception e) {
            logger.error("Error loading admin jobs page: {}", e.getMessage(), e);
            return "redirect:/admin?error=jobs_load_error";
        }
    }
    
    @GetMapping("/admin/reports")
    public String adminReports(Model model) {
        try {
            // Prepare data for reports
            long totalUsers = userService.getTotalUserCount();
            long totalPrinters = printerRepository.count();
            long totalJobs = printJobRepository.count();
            long completedJobs = printJobRepository.countByStatus(PrintJobStatus.COMPLETED);
            
            // Get monthly stats
            Map<String, Object> monthlyStats = new HashMap<>();
            // TODO: Add proper monthly statistics calculation
            
            model.addAttribute("totalUsers", totalUsers);
            model.addAttribute("totalPrinters", totalPrinters);
            model.addAttribute("totalJobs", totalJobs);
            model.addAttribute("completedJobs", completedJobs);
            model.addAttribute("monthlyStats", monthlyStats);
            model.addAttribute("activePage", "admin");
            model.addAttribute("activeAdminSection", "reports");
            return "admin/reports";
        } catch (Exception e) {
            logger.error("Error loading admin reports page: {}", e.getMessage(), e);
            return "redirect:/admin?error=reports_load_error";
        }
    }
    
    @GetMapping("/admin/settings")
    public String adminSettings(Model model) {
        model.addAttribute("activePage", "admin");
        model.addAttribute("activeAdminSection", "settings");
        return "admin/settings";
    }

    @PostMapping("/printers/new")
    public RedirectView addPrinter(@RequestParam String name,
                                 @RequestParam String location,
                                 @RequestParam double blackAndWhiteRate,
                                 @RequestParam double colorRate,
                                 @RequestParam String ipAddress,
                                 Authentication authentication,
                                 RedirectAttributes redirectAttributes) {
        
        if (authentication == null) {
            logger.error("Authentication is null when trying to add printer");
            redirectAttributes.addAttribute("error", "You must be logged in to add a printer");
            return new RedirectView("/login");
        }
        
        try {
            logger.info("Adding new printer: name={}, location={}, ipAddress={}, blackAndWhiteRate={}, colorRate={}", 
                name, location, ipAddress, blackAndWhiteRate, colorRate);
            
            // Get the current user
            logger.info("Generating token for user: {}", authentication.getName());
            String token = jwtUtils.generateToken(authentication.getName());
            logger.info("Token generated successfully");
            
            User currentUser = userService.getUserFromToken("Bearer " + token);
            logger.info("Adding printer for user: {} ({})", currentUser.getName(), currentUser.getRole());
            
            // Create new printer
            Printer printer = new Printer();
            printer.setName(name);
            printer.setLocation(location);
            printer.setBlackAndWhiteRate(blackAndWhiteRate);
            printer.setColorRate(colorRate);
            printer.setIpAddress(ipAddress);
            printer.setOwner(currentUser);
            printer.setStatus(PrinterStatus.ONLINE); // Set status to ONLINE so it shows on homepage
            printer.setQueueLength(0);
            printer.setPrintJobs(new java.util.ArrayList<>()); // Initialize empty list to avoid NPE
            
            // Save the printer
            logger.info("Attempting to save printer to database");
            Printer savedPrinter = printerRepository.save(printer);
            logger.info("Printer added successfully with ID: {}", savedPrinter.getId());
            
            // Determine redirect URL based on user role
            String redirectUrl = "/printers";
            if (currentUser.getRole() == UserRole.ADMIN) {
                redirectUrl = "/admin";
            }
            
            redirectAttributes.addAttribute("success", "Printer added successfully");
            return new RedirectView(redirectUrl);
            
        } catch (Exception e) {
            logger.error("Failed to add printer: {}", e.getMessage(), e);
            logger.error("Exception type: {}", e.getClass().getName());
            logger.error("Stack trace:", e);
            
            // Attempt to get more details about the exception cause
            Throwable cause = e.getCause();
            if (cause != null) {
                logger.error("Caused by: {} - {}", cause.getClass().getName(), cause.getMessage());
            }
            
            // Determine redirect URL based on user role
            String redirectUrl = "/printers";
            if (authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                redirectUrl = "/admin";
            }
            
            redirectAttributes.addAttribute("error", "Failed to add printer: " + e.getMessage());
            return new RedirectView(redirectUrl);
        }
    }

    @GetMapping("/admin/users/{id}")
    public String viewUser(@PathVariable Long id, Model model) {
        try {
            // Get the user details
            User user = userService.getUserById(id);
            if (user == null) {
                return "redirect:/admin/users?error=user_not_found";
            }
            
            // Get user's print jobs
            List<PrintJob> userPrintJobs = printJobRepository.findByUser(user);
            
            // Calculate statistics
            int totalPagesPrinted = userPrintJobs.stream()
                    .mapToInt(PrintJob::getTotalPages)
                    .sum();
                    
            double totalSpent = userPrintJobs.stream()
                    .mapToDouble(PrintJob::getTotalCost)
                    .sum();
            
            // Add to model
            model.addAttribute("user", user);
            model.addAttribute("userPrintJobs", userPrintJobs);
            model.addAttribute("totalPagesPrinted", totalPagesPrinted);
            model.addAttribute("totalSpent", totalSpent);
            model.addAttribute("activePage", "admin");
            model.addAttribute("activeAdminSection", "users");
            
            return "admin/user-view";
        } catch (Exception e) {
            logger.error("Error viewing user: {}", e.getMessage(), e);
            return "redirect:/admin/users?error=view_error";
        }
    }
    
    @GetMapping("/admin/users/{id}/edit")
    public String editUser(@PathVariable Long id, Model model) {
        try {
            User user = userService.getUserById(id);
            if (user == null) {
                return "redirect:/admin/users?error=user_not_found";
            }
            
            model.addAttribute("user", user);
            model.addAttribute("activePage", "admin");
            model.addAttribute("activeAdminSection", "users");
            
            return "admin/user-edit";
        } catch (Exception e) {
            logger.error("Error loading edit user page: {}", e.getMessage(), e);
            return "redirect:/admin/users?error=edit_load_error";
        }
    }
    
    @PostMapping("/admin/users/{id}/update")
    public String updateUser(@PathVariable Long id, 
                            @RequestParam String name,
                            @RequestParam String email,
                            @RequestParam UserRole role,
                            @RequestParam boolean active,
                            @RequestParam(required = false) Double balance,
                            @RequestParam(required = false) String password,
                            @RequestParam(required = false, defaultValue = "false") boolean resetPasswordPrompt,
                            RedirectAttributes redirectAttributes) {
        try {
            // Get the user
            User user = userService.getUserById(id);
            if (user == null) {
                redirectAttributes.addFlashAttribute("error", "User not found");
                return "redirect:/admin/users";
            }
            
            // Update user fields
            user.setName(name);
            user.setEmail(email);
            user.setRole(role);
            user.setActive(active);
            
            if (balance != null) {
                user.setBalance(balance);
            }
            
            // Update password if provided
            if (password != null && !password.isEmpty()) {
                userService.updatePassword(user, password);
                user.setResetPasswordRequired(resetPasswordPrompt);
            }
            
            // Save updated user
            userService.saveUser(user);
            
            redirectAttributes.addFlashAttribute("success", "User updated successfully");
            return "redirect:/admin/users/" + id + "/edit";
            
        } catch (Exception e) {
            logger.error("Error updating user: {}", e.getMessage(), e);
            redirectAttributes.addFlashAttribute("error", "Error updating user: " + e.getMessage());
            return "redirect:/admin/users/" + id + "/edit";
        }
    }
    
    @PostMapping("/admin/users/{id}/delete")
    public String deleteUser(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            // Delete the user
            boolean deleted = userService.deleteUser(id);
            
            if (deleted) {
                redirectAttributes.addFlashAttribute("success", "User deleted successfully");
            } else {
                redirectAttributes.addFlashAttribute("error", "Failed to delete user");
            }
            
            return "redirect:/admin/users";
        } catch (Exception e) {
            logger.error("Error deleting user: {}", e.getMessage(), e);
            redirectAttributes.addFlashAttribute("error", "Error deleting user: " + e.getMessage());
            return "redirect:/admin/users";
        }
    }
} 