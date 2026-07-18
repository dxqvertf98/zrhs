package com.zrhs.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthAndConversationApiTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void signedInUserCanOnlyReadOwnConversationHistory() throws Exception {
        String token = signUpAndGetToken("parent01");

        mockMvc.perform(post("/api/conversations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"originalText":"실내화를 꼭 지참할 것","translatedText":"Bring indoor shoes.","sourceLanguage":"ko","targetLanguage":"en"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalText").value("실내화를 꼭 지참할 것"));

        mockMvc.perform(get("/api/conversations").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].targetLanguage").value("en"));
    }

    @Test
    void socialProviderListIsPublicAndEmptyWithoutSecrets() throws Exception {
        mockMvc.perform(get("/api/auth/social/providers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    private String signUpAndGetToken(String username) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","password":"password-123","displayName":"보호자","preferredLanguage":"en","email":"parent@example.com","termsAccepted":true}
                                """.formatted(username)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return response.get("authentication").get("accessToken").asText();
    }
}
