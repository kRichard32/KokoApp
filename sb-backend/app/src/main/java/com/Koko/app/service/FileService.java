package com.Koko.app.service;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;
import org.apache.commons.io.IOUtils;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class FileService {
    private String fileServerUrl = "http://localhost:8000";
    public byte[] do_GET(String filepath){
        RestTemplate restTemplate = new RestTemplate();
        String resourceUrl = fileServerUrl + "/" + filepath;
        ResponseEntity<byte[]> response
                = restTemplate.getForEntity(resourceUrl + "/1", byte[].class);
        return response.getBody();
    }
    public String do_POST(MultipartFile file){
        String result;
        try{
            result = do_POST(file.getOriginalFilename(), IOUtils.toByteArray(file.getInputStream()));
        }
        catch(IOException e){
            throw new RuntimeException(e);
        }
        return result;

    }
    public String do_POST(String filename, byte [] content){
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        HttpEntity<byte[]> entity = new HttpEntity<>(content, headers);
        String urlTemplate = UriComponentsBuilder.fromHttpUrl(fileServerUrl)
                .queryParam("filename", "{filename}")
                .encode()
                .toUriString();
        Map<String, String> params = new HashMap<>();
        params.put("filename", filename);

        HttpEntity<String> response = restTemplate.exchange(
                urlTemplate,
                HttpMethod.POST,
                entity,
                String.class,
                params
        );

        return response.getBody();
    }
}