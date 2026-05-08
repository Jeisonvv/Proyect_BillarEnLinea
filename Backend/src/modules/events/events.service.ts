import { Injectable } from '@nestjs/common';
import {
  createEventService,
  deleteEventService,
  getEventByIdService,
  getEventBySlugService,
  listEventsService,
  updateEventService,
} from '../../services/event.service.js';
import type { CreateEventDto, ListEventsQueryDto, UpdateEventDto } from './dto/events.dto.js';

@Injectable()
export class EventsNestService {
  createEvent(data: CreateEventDto, createdBy: string) {
    return createEventService(data, createdBy);
  }

  listEvents(query: ListEventsQueryDto) {
    return listEventsService({
      ...(typeof query.status === 'string' && { status: query.status }),
      ...(typeof query.type === 'string' && { type: query.type }),
      ...(typeof query.tier === 'string' && { tier: query.tier }),
      ...(query.featured !== undefined && { featured: String(query.featured) === 'true' }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '20'),
    });
  }

  getEventById(id: string) {
    return getEventByIdService(id);
  }

  getEventBySlug(slug: string) {
    return getEventBySlugService(slug);
  }

  updateEvent(id: string, data: UpdateEventDto) {
    return updateEventService(id, data);
  }

  deleteEvent(id: string) {
    return deleteEventService(id);
  }
}