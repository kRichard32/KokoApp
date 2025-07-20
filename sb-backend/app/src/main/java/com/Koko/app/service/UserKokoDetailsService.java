//package com.Koko.app.service;
//
//import com.Koko.app.domain.UserKoko;
//import com.Koko.app.repositories.UserKokoRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.security.core.authority.SimpleGrantedAuthority;
//import org.springframework.security.core.userdetails.UserDetailsService;
//import org.springframework.security.core.userdetails.UsernameNotFoundException;
//import org.springframework.stereotype.Service;
//
//import java.util.Optional;
//
//@Service
//public class UserKokoDetailsService implements UserDetailsService {
//
//    @Autowired
//    private UserKokoRepository userRepository;
//
//    public UserKoko loadUserByUsername(String username) throws UsernameNotFoundException {
//        Optional<UserKoko> user = userRepository.findByEmail(username);
//        return user.orElseThrow(() -> new UsernameNotFoundException("Invalid Email"));
//    }
//
//}