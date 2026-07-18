package com.zrhs.api.conversation;

import com.zrhs.api.conversation.ConversationDtos.ConversationResponse;
import com.zrhs.api.conversation.ConversationDtos.CreateConversationRequest;
import com.zrhs.api.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {
    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConversationResponse create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateConversationRequest request
    ) {
        return conversationService.create(user.id(), request);
    }

    @GetMapping
    public List<ConversationResponse> findAll(@AuthenticationPrincipal AuthenticatedUser user) {
        return conversationService.findAll(user.id());
    }

    @GetMapping("/{conversationId}")
    public ConversationResponse findOne(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long conversationId
    ) {
        return conversationService.findOne(user.id(), conversationId);
    }

    @DeleteMapping("/{conversationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long conversationId
    ) {
        conversationService.delete(user.id(), conversationId);
    }
}
