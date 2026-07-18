package com.zrhs.api.conversation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class ConversationDtos {
    private ConversationDtos() {
    }

    /**
     * AI 연결 전에도 번역 결과를 저장·조회할 수 있도록 만든 계약입니다.
     * 번역 API가 붙으면 AI 응답을 이 요청의 translatedText에 넣어 저장하면 됩니다.
     */
    public record CreateConversationRequest(
            @NotBlank @Size(max = 10000) String originalText,
            @NotBlank @Size(max = 10000) String translatedText,
            @NotBlank @Size(max = 10) String sourceLanguage,
            @NotBlank @Size(max = 10) String targetLanguage
    ) {
    }

    public record ConversationResponse(
            Long id,
            String originalText,
            String translatedText,
            String sourceLanguage,
            String targetLanguage,
            Instant createdAt
    ) {
    }
}
