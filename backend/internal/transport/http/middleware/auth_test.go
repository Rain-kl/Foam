package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestBearerTokenAcceptsCaseInsensitiveSchemeAndWhitespace(t *testing.T) {
	token, ok := bearerToken("  bearer\tsecret-token  ")
	if !ok || token != "secret-token" {
		t.Fatalf("token = %q, ok = %v", token, ok)
	}
	for _, value := range []string{"", "Bearer", "Basic token", "Bearer token extra"} {
		if _, ok := bearerToken(value); ok {
			t.Fatalf("header %q unexpectedly accepted", value)
		}
	}
}

func TestAdminAuthNilServiceReturnsServiceUnavailable(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/protected", AdminAuth(nil), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer some-token")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d body = %s", rec.Code, rec.Body.String())
	}
	var body struct {
		ErrorMsg string `json:"error_msg"`
		Data     any    `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.ErrorMsg == "" {
		t.Fatalf("expected error_msg, body = %s", rec.Body.String())
	}
}
