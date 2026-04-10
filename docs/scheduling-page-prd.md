# Scheduling Page PRD

## Product Summary
The Scheduling page is the control center where hosts create and manage bookable event types. It helps users launch booking links quickly without navigating deep settings.

## Problem Statement
- Hosts need a fast way to define event formats (one-on-one, group, round robin).
- Today, event setup is fragmented and lacks a clear first action.
- Teams need readable status and quick sharing links from one screen.

## Goals (MVP)
- Surface all supported scheduling event types in one place.
- Let users discover event types quickly using search.
- Allow selecting an event type as the current setup context.
- Provide one-click copy for event booking links.

## Non-Goals (MVP)
- Full event creation wizard
- Availability rules editor
- Routing logic configuration
- External calendar OAuth flows

## Primary User Stories
- As a host, I can see available event types and pick one to continue setup.
- As a host, I can search event types by name or description.
- As a host, I can copy booking links for each event type in one click.
- As an admin, I can use round robin to distribute meetings among teammates.

## Event Types in Scope
- One-on-one: 1 host -> 1 invitee
- Group: 1 host -> multiple invitees
- Round robin: rotating hosts -> 1 invitee

## UX Requirements
- Clear page title and supporting copy.
- Search input above event list.
- List items show title, participant model, and usage description.
- Active selection uses theme accent background and text.
- Right rail includes quick details and copy-link actions.

## Functional Requirements
- Maintain event type metadata in a reusable source module.
- Reuse the same metadata in both Scheduling page and New Booking modal.
- Persist selected event type in dashboard UI store.
- Show transient "Copied link" feedback after copy action.

## Success Metrics
- % users selecting an event type within 30 seconds
- Copy-link click-through rate
- Time-to-first-booking-link action
- Drop-off rate from Scheduling page

## Future Milestones
- Event creation/edit drawer per type
- Duration and location presets
- Team routing rules for round robin
- API-backed event CRUD and analytics
