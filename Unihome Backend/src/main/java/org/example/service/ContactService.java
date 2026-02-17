package org.example.service;

import java.util.Locale;
import java.util.Optional;
import org.example.dto.contact.ContactMessageResponse;
import org.example.dto.contact.SubmitContactRequest;
import org.example.model.contact.ContactMessageEntity;
import org.example.model.contact.ContactRecipientEntity;
import org.example.repository.ContactMessageRepository;
import org.example.repository.ContactRecipientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    private final ContactMessageRepository contactMessageRepository;
    private final ContactRecipientRepository contactRecipientRepository;
    private final JavaMailSender mailSender;

    @Value("${unihome.contact.from:no-reply@unihome.local}")
    private String fromAddress;

    @Value("${unihome.contact.fallback-to:}")
    private String fallbackTo;

    public ContactService(ContactMessageRepository contactMessageRepository,
                         ContactRecipientRepository contactRecipientRepository,
                         JavaMailSender mailSender) {
        this.contactMessageRepository = contactMessageRepository;
        this.contactRecipientRepository = contactRecipientRepository;
        this.mailSender = mailSender;
    }

    @Transactional
    public ContactMessageResponse submitMessage(SubmitContactRequest request) {
        ContactMessageEntity entity = new ContactMessageEntity();
        entity.setName(request.getName().trim());
        entity.setEmail(request.getEmail().trim().toLowerCase(Locale.ROOT));
        entity.setSubject(normalize(request.getSubject()));
        entity.setMessage(request.getMessage().trim());
        ContactMessageEntity saved = contactMessageRepository.save(entity);

        boolean emailSent = sendEmailIfPossible(saved);

        ContactMessageResponse response = new ContactMessageResponse();
        response.setId(saved.getId());
        response.setCreatedAt(saved.getCreatedAt());
        response.setEmailSent(emailSent);
        response.setRecipientEmail(resolveRecipientEmail().orElse(null));
        return response;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean sendEmailIfPossible(ContactMessageEntity message) {
        Optional<String> recipientOpt = resolveRecipientEmail();
        if (recipientOpt.isEmpty()) {
            log.warn("No active contact recipient configured; skipping email send");
            return false;
        }

        String recipient = recipientOpt.get();
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(fromAddress);
        mail.setTo(recipient);
        String subject = message.getSubject() != null && !message.getSubject().isBlank()
            ? message.getSubject()
            : "Νέο μήνυμα επικοινωνίας";
        mail.setSubject(subject);

        StringBuilder body = new StringBuilder();
        body.append("Νέο μήνυμα από τη φόρμα επικοινωνίας\n\n");
        body.append("Όνομα: ").append(message.getName()).append("\n");
        body.append("Email: ").append(message.getEmail()).append("\n");
        if (message.getSubject() != null && !message.getSubject().isBlank()) {
            body.append("Θέμα: ").append(message.getSubject()).append("\n");
        }
        body.append("Μήνυμα:\n").append(message.getMessage()).append("\n\n");
        mail.setText(body.toString());

        try {
            mailSender.send(mail);
            return true;
        } catch (MailException ex) {
            log.error("Failed to send contact email to {}", recipient, ex);
            return false;
        }
    }

    private Optional<String> resolveRecipientEmail() {
        return contactRecipientRepository.findFirstByActiveTrueOrderByCreatedAtDesc()
            .map(ContactRecipientEntity::getEmail)
            .or(() -> {
                String fallback = normalize(fallbackTo);
                return (fallback == null) ? Optional.empty() : Optional.of(fallback);
            });
    }
}
