package settings

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	settingsdomain "github.com/Rain-kl/Foam/backend/internal/domain/settings"
	"github.com/Rain-kl/Foam/backend/internal/infra/config"
	"github.com/Rain-kl/Foam/backend/internal/repository"
)

var (
	ErrInvalidInput = errors.New("运行设置参数无效")
	ErrConflict     = errors.New("运行设置已被其他会话更新")
)

// EditableConfig 是管理接口可写入的字段。
type EditableConfig struct {
	App      AppConfigInput
	Frontend FrontendConfigInput
}

type AppConfigInput struct {
	DisplayName string
}

type FrontendConfigInput struct {
	PublicAPIBaseURL string
}

// Snapshot 是管理端读取的完整设置视图。
type Snapshot struct {
	Config    EditableConfig
	Revision  uint64
	UpdatedAt time.Time
	// FilePublicAPIBaseURL 来自 config.yaml 的基线值（未覆盖时生效）。
	FilePublicAPIBaseURL string
}

// Service 管理运行设置的内存镜像与持久化。
type Service struct {
	mu         sync.RWMutex
	repository repository.RuntimeSettingsRepository
	fileBase   config.Config
	current    settingsdomain.Config
	updatedAt  time.Time
	revision   uint64
}

func NewService(fileBase config.Config, current settingsdomain.Config, updatedAt time.Time, revision uint64, repo repository.RuntimeSettingsRepository) *Service {
	return &Service{
		repository: repo,
		fileBase:   fileBase,
		current:    current,
		updatedAt:  updatedAt,
		revision:   revision,
	}
}

// LoadPersisted 从仓储加载并与文件配置合并为初始 domain 配置。
func LoadPersisted(ctx context.Context, _ config.Config, repo repository.RuntimeSettingsRepository) (settingsdomain.Config, time.Time, uint64, error) {
	value, updatedAt, revision, found, err := repo.Get(ctx)
	if err != nil {
		return settingsdomain.Config{}, time.Time{}, 0, err
	}
	if !found {
		return settingsdomain.Config{}, time.Time{}, 0, nil
	}
	return value, updatedAt, revision, nil
}

func (s *Service) Get() Snapshot {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.snapshotLocked()
}

// PublicAPIBaseURL 返回生效的公开 API 根地址（运行覆盖优先）。
func (s *Service) PublicAPIBaseURL() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if value := strings.TrimRight(strings.TrimSpace(s.current.Frontend.PublicAPIBaseURL), "/"); value != "" {
		return value
	}
	return s.fileBase.Frontend.EffectivePublicAPIBaseURL()
}

// DisplayName 返回生效的产品展示名。
func (s *Service) DisplayName() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if value := strings.TrimSpace(s.current.App.DisplayName); value != "" {
		return value
	}
	return "Foam"
}

func (s *Service) Update(ctx context.Context, expectedRevision uint64, input EditableConfig) (Snapshot, error) {
	normalized, err := normalizeEditable(input)
	if err != nil {
		return Snapshot{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if expectedRevision != s.revision {
		return Snapshot{}, ErrConflict
	}

	next := settingsdomain.Config{
		App: settingsdomain.AppConfig{
			DisplayName: normalized.App.DisplayName,
		},
		Frontend: settingsdomain.FrontendConfig{
			PublicAPIBaseURL: normalized.Frontend.PublicAPIBaseURL,
		},
	}

	updatedAt, revision, err := s.repository.Save(ctx, next, expectedRevision)
	if err != nil {
		if errors.Is(err, repository.ErrConflict) {
			return Snapshot{}, ErrConflict
		}
		return Snapshot{}, err
	}
	s.current = next
	s.updatedAt = updatedAt
	s.revision = revision
	return s.snapshotLocked(), nil
}

func (s *Service) snapshotLocked() Snapshot {
	return Snapshot{
		Config: EditableConfig{
			App: AppConfigInput{
				DisplayName: s.current.App.DisplayName,
			},
			Frontend: FrontendConfigInput{
				PublicAPIBaseURL: s.current.Frontend.PublicAPIBaseURL,
			},
		},
		Revision:             s.revision,
		UpdatedAt:            s.updatedAt,
		FilePublicAPIBaseURL: s.fileBase.Frontend.EffectivePublicAPIBaseURL(),
	}
}

func normalizeEditable(input EditableConfig) (EditableConfig, error) {
	displayName := strings.TrimSpace(input.App.DisplayName)
	if utf8.RuneCountInString(displayName) > 64 {
		return EditableConfig{}, ErrInvalidInput
	}

	publicBase := strings.TrimSpace(input.Frontend.PublicAPIBaseURL)
	if publicBase != "" {
		publicBase = strings.TrimRight(publicBase, "/")
		parsed, err := url.Parse(publicBase)
		if err != nil || parsed.Scheme == "" || parsed.Host == "" {
			return EditableConfig{}, ErrInvalidInput
		}
		if parsed.Scheme != "http" && parsed.Scheme != "https" {
			return EditableConfig{}, ErrInvalidInput
		}
	}

	return EditableConfig{
		App:      AppConfigInput{DisplayName: displayName},
		Frontend: FrontendConfigInput{PublicAPIBaseURL: publicBase},
	}, nil
}
