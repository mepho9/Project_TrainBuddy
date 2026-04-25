package be.trainbuddy.backend.exception;

import be.trainbuddy.backend.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiErrorResponse handleResourceNotFound(
            ResourceNotFoundException ex,
            HttpServletRequest request
    ) {
        return new ApiErrorResponse(
                java.time.LocalDateTime.now(),
                404,
                "Not Found",
                ex.getMessage(),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleBadRequest(
            BadRequestException ex,
            HttpServletRequest request
    ) {
        return new ApiErrorResponse(
                java.time.LocalDateTime.now(),
                400,
                "Bad Request",
                ex.getMessage(),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(ConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiErrorResponse handleConflict(
            ConflictException ex,
            HttpServletRequest request
    ) {
        return new ApiErrorResponse(
                java.time.LocalDateTime.now(),
                409,
                "Conflict",
                ex.getMessage(),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getField() + " : " + error.getDefaultMessage())
                .orElse("Données invalides");

        return new ApiErrorResponse(
                java.time.LocalDateTime.now(),
                400,
                "Validation Error",
                message,
                request.getRequestURI()
        );
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiErrorResponse handleGeneralException(
            Exception ex,
            HttpServletRequest request
    ) {
        return new ApiErrorResponse(
                java.time.LocalDateTime.now(),
                500,
                "Internal Server Error",
                "Une erreur interne est survenue",
                request.getRequestURI()
        );
    }
}