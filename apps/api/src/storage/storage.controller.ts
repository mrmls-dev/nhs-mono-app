import {
    Body,
    Controller,
    Delete,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IsString, IsNotEmpty } from "class-validator";
import { StorageService } from "./storage.service";

class DeleteFileDto {
    @IsString()
    @IsNotEmpty()
    key!: string;
}

@Controller("storage")
export class StorageController {
    constructor(private readonly storageService: StorageService) {}

    @Post("upload")
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(
        FileInterceptor("file", {
            limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
        })
    )
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @Query("folder") folder?: string
    ): Promise<{ url: string; key: string }> {
        if (!file) throw new BadRequestException("No file provided");
        return this.storageService.uploadFile(file, folder);
    }

    @Delete("delete")
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Body() dto: DeleteFileDto): Promise<void> {
        return this.storageService.deleteFile(dto.key);
    }
}
