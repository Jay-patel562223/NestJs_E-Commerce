import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";

export interface Response<T> {
    message: string,
    success: boolean,
    result: any,
    error: null,
    timeStamps: Date,
    statusCode: number,
}

export class TransformationInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        const path = context?.switchToHttp()?.getResponse()?.req?.url;
        return next.handle().pipe(
            map((data) => ({
                message: data?.message,
                success: data?.success,
                result: data?.result,
                timeStamps: new Date(),
                statusCode,
                path,
                error: null,
            })),
        )
    }
}
