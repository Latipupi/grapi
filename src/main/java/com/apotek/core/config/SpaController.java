package com.apotek.core.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({
        "/login",
        "/home",
        "/dashboard",
        "/dashboard/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
