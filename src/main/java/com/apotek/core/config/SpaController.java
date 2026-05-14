package com.apotek.core.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({
        "/pos/**",
        "/inventory/**",
        "/purchasing/**",
        "/master/**",
        "/reports/**",
        "/settings/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
