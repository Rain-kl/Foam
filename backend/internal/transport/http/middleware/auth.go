package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/Rain-kl/Foam/backend/internal/application/adminauth"
	"github.com/Rain-kl/Foam/backend/internal/shared/response"
	"github.com/gin-gonic/gin"
)

const (
	AdminKey = "admin"
)

// AdminAuth 校验管理员 Bearer JWT。
func AdminAuth(service *adminauth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := bearerToken(c.GetHeader("Authorization"))
		if !ok {
			response.Error(c, http.StatusUnauthorized, "adminUnauthorized", "未登录")
			return
		}
		if service == nil {
			response.Error(c, http.StatusServiceUnavailable, "authRuntimeUnavailable", "管理员认证服务暂不可用")
			return
		}
		value, err := service.AuthenticateAccess(c.Request.Context(), raw)
		if err != nil {
			if errors.Is(err, adminauth.ErrRuntimeUnavailable) {
				response.Error(c, http.StatusServiceUnavailable, "authRuntimeUnavailable", "管理员认证服务暂不可用")
				return
			}
			response.Error(c, http.StatusUnauthorized, "adminUnauthorized", "未登录")
			return
		}
		c.Set(AdminKey, value)
		c.Next()
	}
}

func bearerToken(header string) (string, bool) {
	parts := strings.Fields(header)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", false
	}
	token := parts[1]
	return token, token != ""
}
