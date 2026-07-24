package settings

// Config 表示可跨重启持久化、支持管理端热更新的运行参数。
// 仅保留脚手架通用字段；业务模块可在二次开发时扩展此结构。
type Config struct {
	App      AppConfig
	Frontend FrontendConfig
}

// AppConfig 定义产品展示相关运行参数。
type AppConfig struct {
	// DisplayName 管理端展示名称；空字符串表示使用默认 "Foam"。
	DisplayName string
}

// FrontendConfig 定义前端/公开地址相关运行参数。
type FrontendConfig struct {
	// PublicAPIBaseURL 覆盖配置文件中的公开 API 根地址；空表示回退到 config.yaml。
	PublicAPIBaseURL string
}
