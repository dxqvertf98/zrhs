package com.zrhs.api.conversation;

import com.zrhs.api.common.NotFoundException;
import com.zrhs.api.conversation.ConversationDtos.ConversationResponse;
import com.zrhs.api.conversation.ConversationDtos.CreateConversationRequest;
import com.zrhs.api.user.User;
import com.zrhs.api.user.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ConversationService {
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    public ConversationService(ConversationRepository conversationRepository, UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ConversationResponse create(Long userId, CreateConversationRequest request) {
        User user = userRepository.getReferenceById(userId);
        Conversation conversation = conversationRepository.save(new Conversation(
                user,
                request.originalText().trim(),
                request.translatedText().trim(),
                request.sourceLanguage().trim(),
                request.targetLanguage().trim()
        ));
        return toResponse(conversation);
    }

    public List<ConversationResponse> findAll(Long userId) {
        return conversationRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ConversationResponse findOne(Long userId, Long conversationId) {
        Conversation conversation = conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new NotFoundException("대화 기록을 찾을 수 없습니다."));
        return toResponse(conversation);
    }

    @Transactional
    public void delete(Long userId, Long conversationId) {
        Conversation conversation = conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new NotFoundException("대화 기록을 찾을 수 없습니다."));
        conversationRepository.delete(conversation);
    }

    private ConversationResponse toResponse(Conversation conversation) {
        return new ConversationResponse(
                conversation.getId(),
                conversation.getOriginalText(),
                conversation.getTranslatedText(),
                conversation.getSourceLanguage(),
                conversation.getTargetLanguage(),
                conversation.getCreatedAt()
        );
    }
}
