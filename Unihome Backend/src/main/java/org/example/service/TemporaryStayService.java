package org.example.service;

import org.example.dto.common.PagedResponse;
import org.example.dto.temporary.CreateTemporaryStayRequest;
import org.example.dto.temporary.TemporaryStayResponse;
import org.example.dto.temporary.TemporaryStaySearchCriteria;
import org.example.dto.temporary.UpdateTemporaryStayRequest;
import org.example.exception.ForbiddenException;
import org.example.exception.ResourceNotFoundException;
import org.example.mapper.TemporaryStayMapper;
import org.example.model.temporary.TemporaryStayEntity;
import org.example.model.user.UserEntity;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.example.model.user.UserRole;
import org.example.repository.TemporaryStayRepository;
import org.example.repository.specification.TemporaryStaySpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TemporaryStayService {

    private final TemporaryStayRepository temporaryStayRepository;
    private final TemporaryStayMapper temporaryStayMapper;
    private final UserService userService;

    public TemporaryStayService(TemporaryStayRepository temporaryStayRepository, TemporaryStayMapper temporaryStayMapper, UserService userService) {
        this.temporaryStayRepository = temporaryStayRepository;
        this.temporaryStayMapper = temporaryStayMapper;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<TemporaryStayResponse> search(TemporaryStaySearchCriteria criteria, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        Specification<TemporaryStayEntity> specification = TemporaryStaySpecifications.fromCriteria(criteria);
        Page<TemporaryStayEntity> result = temporaryStayRepository.findAll(specification, pageable);
        List<TemporaryStayResponse> items = result.stream()
            .map(temporaryStayMapper::toResponse)
            .collect(Collectors.toList());
        return new PagedResponse<>(items, result.getTotalElements(), result.getTotalPages(), result.getNumber(), result.getSize());
    }

    @Transactional
    public TemporaryStayResponse create(UUID managerId, CreateTemporaryStayRequest request) {
        UserEntity manager = requireManager(managerId);
        TemporaryStayEntity entity = temporaryStayMapper.toEntity(request);
        entity.setManager(manager);
        entity.setPublished(true);
        TemporaryStayEntity saved = temporaryStayRepository.save(entity);
        return temporaryStayMapper.toResponse(saved);
    }

    @Transactional
    public TemporaryStayResponse update(UUID managerId, UUID stayId, UpdateTemporaryStayRequest request) {
        UserEntity manager = requireManager(managerId);
        TemporaryStayEntity stay = requireStay(stayId);
        ensureOwnership(manager, stay);
        temporaryStayMapper.apply(stay, request);
        return temporaryStayMapper.toResponse(stay);
    }

    @Transactional
    public void delete(UUID managerId, UUID stayId) {
        UserEntity manager = requireManager(managerId);
        TemporaryStayEntity stay = requireStay(stayId);
        ensureOwnership(manager, stay);
        temporaryStayRepository.delete(stay);
    }

    @Transactional(readOnly = true)
    public TemporaryStayResponse getById(UUID stayId, UUID viewerId) {
        TemporaryStayEntity stay = requireStay(stayId);
        if (!stay.isPublished()) {
            UUID managerId = stay.getManager() != null ? stay.getManager().getId() : null;
            if (viewerId == null || managerId == null || !managerId.equals(viewerId)) {
                throw new ResourceNotFoundException("Temporary stay not found");
            }
        }
        return temporaryStayMapper.toResponse(stay);
    }

    @Transactional(readOnly = true)
    public List<TemporaryStayResponse> findRecent(int limit) {
        if (limit <= 0) {
            return List.of();
        }
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<TemporaryStayEntity> stays = temporaryStayRepository.findByPublishedTrue(pageable).getContent();
        return stays.stream().map(temporaryStayMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TemporaryStayResponse> findManagerStays(UUID managerId) {
        UserEntity manager = requireManager(managerId);
        return temporaryStayRepository.findAllByManagerIdOrderByCreatedAtDesc(manager.getId()).stream()
            .map(temporaryStayMapper::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public TemporaryStayResponse hide(UUID managerId, UUID stayId) {
        UserEntity manager = requireManager(managerId);
        TemporaryStayEntity stay = requireStay(stayId);
        ensureOwnership(manager, stay);
        stay.setPublished(false);
        return temporaryStayMapper.toResponse(stay);
    }

    @Transactional
    public TemporaryStayResponse publish(UUID managerId, UUID stayId) {
        UserEntity manager = requireManager(managerId);
        TemporaryStayEntity stay = requireStay(stayId);
        ensureOwnership(manager, stay);
        stay.setPublished(true);
        return temporaryStayMapper.toResponse(stay);
    }

    private TemporaryStayEntity requireStay(UUID id) {
        return temporaryStayRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Temporary stay not found"));
    }

    private UserEntity requireManager(UUID managerId) {
        UserEntity user = userService.findUser(managerId);
        if (user.getRole() != UserRole.OWNER && user.getRole() != UserRole.REGULAR) {
            throw new ForbiddenException("You are not allowed to manage temporary stays");
        }
        return user;
    }

    private void ensureOwnership(UserEntity manager, TemporaryStayEntity stay) {
        if (stay.getManager() == null) {
            stay.setManager(manager);
            return;
        }
        if (!stay.getManager().getId().equals(manager.getId())) {
            throw new ForbiddenException("You are not allowed to modify this temporary stay");
        }
    }
}
