package com.Koko.app.domain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

public class jsonTools {
    static List<String> getStrings(String jsonString) {
        ObjectMapper mapper = new ObjectMapper();
        List<String> result;
        try{
            result = mapper.readValue(jsonString, new TypeReference<>(){});
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
        return result;
    }
}
