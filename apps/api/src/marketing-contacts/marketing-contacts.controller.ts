import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from "@nestjs/common";
import { MarketingContactsService } from "./marketing-contacts.service";
import { SessionGuard } from "../auth/session.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/auth.decorators";
import { UpdateMarketingContactDto } from "./dto/update-marketing-contact.dto";

/**
 * Internal marketing contact workflow. Platform staff only (owner satisfies
 * `admin` via RolesGuard); never exposed to white-label agent tenants.
 */
@Controller("marketing-contacts")
@UseGuards(SessionGuard, RolesGuard)
@Roles("admin")
export class MarketingContactsController {
    constructor(private readonly service: MarketingContactsService) {}

    /** List every stored contact, newest first. */
    @Get()
    findAll() {
        return this.service.listContacts();
    }

    /** Pull the latest engaged contacts from GHL and upsert (no duplicates). */
    @Post("sync")
    sync() {
        return this.service.sync();
    }

    /** Edit a contact's phone (pushed to GHL) / status / outreach / note. */
    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: UpdateMarketingContactDto) {
        return this.service.update(id, dto);
    }
}
