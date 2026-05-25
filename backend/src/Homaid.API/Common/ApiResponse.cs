using Homaid.Application.Common;

namespace Homaid.API.Common;

public record ApiError(string Code, string Message);

public record ApiResponse<T>(bool Success, T? Data, ApiError? Error)
{
    public static ApiResponse<T> Ok(T data) => new(true, data, null);
    public static ApiResponse<T> Fail(Error error) => new(false, default, new ApiError(error.Code, error.Message));
}

public static class ResultExtensions
{
    public static Microsoft.AspNetCore.Mvc.IActionResult ToActionResult<T>(this Result<T> result)
    {
        if (result.IsSuccess)
            return new Microsoft.AspNetCore.Mvc.OkObjectResult(ApiResponse<T>.Ok(result.Value));

        return ToErrorResult<T>(result.Error);
    }

    public static Microsoft.AspNetCore.Mvc.IActionResult ToActionResult(this Result result)
    {
        if (result.IsSuccess)
            return new Microsoft.AspNetCore.Mvc.NoContentResult();
        return ToErrorResult<object>(result.Error);
    }

    private static Microsoft.AspNetCore.Mvc.IActionResult ToErrorResult<T>(Error error)
    {
        var body = ApiResponse<T>.Fail(error);
        return error.Type switch
        {
            ErrorType.NotFound     => new Microsoft.AspNetCore.Mvc.NotFoundObjectResult(body),
            ErrorType.Conflict     => new Microsoft.AspNetCore.Mvc.ConflictObjectResult(body),
            ErrorType.Validation   => new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(body),
            ErrorType.Unauthorized => new Microsoft.AspNetCore.Mvc.UnauthorizedObjectResult(body),
            ErrorType.Forbidden    => new Microsoft.AspNetCore.Mvc.ObjectResult(body) { StatusCode = 403 },
            _ => new Microsoft.AspNetCore.Mvc.ObjectResult(body) { StatusCode = 500 }
        };
    }
}
