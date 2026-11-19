-- ADR-011 (RF06, RF32): the strava-connector is no longer a source. Strava is read directly.
-- Rides imported through the connector keep their data (same Strava activity ids) and become STRAVA rides.
UPDATE "Ride" SET "source" = 'STRAVA' WHERE "source" = 'CONNECTOR';
-- Athletes that used the connector go back to manual until they connect Strava again.
UPDATE "User" SET "activitySource" = 'MANUAL' WHERE "activitySource" = 'CONNECTOR';
-- The connector URL and encrypted API keys are deleted.
DROP TABLE "ConnectorConnection";
