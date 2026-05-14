--
-- PostgreSQL database dump
--

\restrict WGLxRNJ1w2h9Pn5NtdyA5fuogdcgGXwjuBrHfC02SOv0NNY2Vw7O4ZXJSengigr

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.vto DROP CONSTRAINT IF EXISTS vto_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.todos DROP CONSTRAINT IF EXISTS todos_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.todos DROP CONSTRAINT IF EXISTS todos_source_meeting_id_meetings_id_fk;
ALTER TABLE IF EXISTS ONLY public.todos DROP CONSTRAINT IF EXISTS todos_owner_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.team_settings DROP CONSTRAINT IF EXISTS team_settings_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_pool DROP CONSTRAINT IF EXISTS task_pool_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.task_pool DROP CONSTRAINT IF EXISTS task_pool_suggested_station_id_stations_id_fk;
ALTER TABLE IF EXISTS ONLY public.task_pool DROP CONSTRAINT IF EXISTS task_pool_source_todo_id_todos_id_fk;
ALTER TABLE IF EXISTS ONLY public.task_pool DROP CONSTRAINT IF EXISTS task_pool_assigned_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.task_pool DROP CONSTRAINT IF EXISTS task_pool_assigned_shift_session_id_shift_sessions_id_fk;
ALTER TABLE IF EXISTS ONLY public.stations DROP CONSTRAINT IF EXISTS stations_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.station_default_operators DROP CONSTRAINT IF EXISTS station_default_operators_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.station_default_operators DROP CONSTRAINT IF EXISTS station_default_operators_station_id_stations_id_fk;
ALTER TABLE IF EXISTS ONLY public.shift_sessions DROP CONSTRAINT IF EXISTS shift_sessions_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.shift_sessions DROP CONSTRAINT IF EXISTS shift_sessions_opened_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.shift_events DROP CONSTRAINT IF EXISTS shift_events_station_id_stations_id_fk;
ALTER TABLE IF EXISTS ONLY public.shift_events DROP CONSTRAINT IF EXISTS shift_events_shift_session_id_shift_sessions_id_fk;
ALTER TABLE IF EXISTS ONLY public.shift_events DROP CONSTRAINT IF EXISTS shift_events_recorded_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS shift_assignments_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS shift_assignments_station_id_stations_id_fk;
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS shift_assignments_shift_session_id_shift_sessions_id_fk;
ALTER TABLE IF EXISTS ONLY public.seats DROP CONSTRAINT IF EXISTS seats_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.seats DROP CONSTRAINT IF EXISTS seats_person_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.scorecard_metrics DROP CONSTRAINT IF EXISTS scorecard_metrics_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.scorecard_metrics DROP CONSTRAINT IF EXISTS scorecard_metrics_owner_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.scorecard_entries DROP CONSTRAINT IF EXISTS scorecard_entries_metric_id_scorecard_metrics_id_fk;
ALTER TABLE IF EXISTS ONLY public.rocks DROP CONSTRAINT IF EXISTS rocks_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.rocks DROP CONSTRAINT IF EXISTS rocks_owner_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.rock_subtasks DROP CONSTRAINT IF EXISTS rock_subtasks_rock_id_rocks_id_fk;
ALTER TABLE IF EXISTS ONLY public.rock_activity DROP CONSTRAINT IF EXISTS rock_activity_rock_id_rocks_id_fk;
ALTER TABLE IF EXISTS ONLY public.rock_activity DROP CONSTRAINT IF EXISTS rock_activity_actor_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.processes DROP CONSTRAINT IF EXISTS processes_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.processes DROP CONSTRAINT IF EXISTS processes_owner_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.pm_schedules DROP CONSTRAINT IF EXISTS pm_schedules_station_id_stations_id_fk;
ALTER TABLE IF EXISTS ONLY public.people_ratings DROP CONSTRAINT IF EXISTS people_ratings_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.people_ratings DROP CONSTRAINT IF EXISTS people_ratings_subject_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.people_ratings DROP CONSTRAINT IF EXISTS people_ratings_core_value_id_core_values_id_fk;
ALTER TABLE IF EXISTS ONLY public.meetings DROP CONSTRAINT IF EXISTS meetings_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.meeting_rsvps DROP CONSTRAINT IF EXISTS meeting_rsvps_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.meeting_rsvps DROP CONSTRAINT IF EXISTS meeting_rsvps_meeting_id_meetings_id_fk;
ALTER TABLE IF EXISTS ONLY public.meeting_ratings DROP CONSTRAINT IF EXISTS meeting_ratings_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.meeting_ratings DROP CONSTRAINT IF EXISTS meeting_ratings_meeting_id_meetings_id_fk;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_team_id_teams_id_fk;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_source_metric_id_scorecard_metrics_id_fk;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_owner_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.headlines DROP CONSTRAINT IF EXISTS headlines_meeting_id_meetings_id_fk;
ALTER TABLE IF EXISTS ONLY public.headlines DROP CONSTRAINT IF EXISTS headlines_author_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.core_values DROP CONSTRAINT IF EXISTS core_values_team_id_teams_id_fk;
DROP INDEX IF EXISTS public.idx_vto_team;
DROP INDEX IF EXISTS public.idx_todos_status_owner;
DROP INDEX IF EXISTS public.idx_seats_team;
DROP INDEX IF EXISTS public.idx_routings_station_priority;
DROP INDEX IF EXISTS public.idx_routings_complete;
DROP INDEX IF EXISTS public.idx_rocks_quarter;
DROP INDEX IF EXISTS public.idx_rock_activity_rock_created;
DROP INDEX IF EXISTS public.idx_processes_team;
DROP INDEX IF EXISTS public.idx_people_ratings_subject_quarter;
DROP INDEX IF EXISTS public.idx_core_values_team;
ALTER TABLE IF EXISTS ONLY public.vto DROP CONSTRAINT IF EXISTS vto_team_id_unique;
ALTER TABLE IF EXISTS ONLY public.vto DROP CONSTRAINT IF EXISTS vto_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.todos DROP CONSTRAINT IF EXISTS todos_pkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_pkey;
ALTER TABLE IF EXISTS ONLY public.team_settings DROP CONSTRAINT IF EXISTS team_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.task_pool DROP CONSTRAINT IF EXISTS task_pool_pkey;
ALTER TABLE IF EXISTS ONLY public.stations DROP CONSTRAINT IF EXISTS stations_pkey;
ALTER TABLE IF EXISTS ONLY public.station_default_operators DROP CONSTRAINT IF EXISTS station_default_operators_station_id_user_id_unique;
ALTER TABLE IF EXISTS ONLY public.station_default_operators DROP CONSTRAINT IF EXISTS station_default_operators_pkey;
ALTER TABLE IF EXISTS ONLY public.shift_sessions DROP CONSTRAINT IF EXISTS shift_sessions_team_id_date_shift_number_unique;
ALTER TABLE IF EXISTS ONLY public.shift_sessions DROP CONSTRAINT IF EXISTS shift_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.shift_events DROP CONSTRAINT IF EXISTS shift_events_pkey;
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS shift_assignments_shift_session_id_station_id_user_id_unique;
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS shift_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.seats DROP CONSTRAINT IF EXISTS seats_pkey;
ALTER TABLE IF EXISTS ONLY public.scorecard_metrics DROP CONSTRAINT IF EXISTS scorecard_metrics_pkey;
ALTER TABLE IF EXISTS ONLY public.scorecard_entries DROP CONSTRAINT IF EXISTS scorecard_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.scorecard_entries DROP CONSTRAINT IF EXISTS scorecard_entries_metric_week_unique;
ALTER TABLE IF EXISTS ONLY public.rocks DROP CONSTRAINT IF EXISTS rocks_pkey;
ALTER TABLE IF EXISTS ONLY public.rock_subtasks DROP CONSTRAINT IF EXISTS rock_subtasks_pkey;
ALTER TABLE IF EXISTS ONLY public.rock_activity DROP CONSTRAINT IF EXISTS rock_activity_pkey;
ALTER TABLE IF EXISTS ONLY public.processes DROP CONSTRAINT IF EXISTS processes_pkey;
ALTER TABLE IF EXISTS ONLY public.pm_schedules DROP CONSTRAINT IF EXISTS pm_schedules_pkey;
ALTER TABLE IF EXISTS ONLY public.people_ratings DROP CONSTRAINT IF EXISTS people_ratings_subject_value_quarter_unique;
ALTER TABLE IF EXISTS ONLY public.people_ratings DROP CONSTRAINT IF EXISTS people_ratings_pkey;
ALTER TABLE IF EXISTS ONLY public.meetings DROP CONSTRAINT IF EXISTS meetings_pkey;
ALTER TABLE IF EXISTS ONLY public.meeting_rsvps DROP CONSTRAINT IF EXISTS meeting_rsvps_pkey;
ALTER TABLE IF EXISTS ONLY public.meeting_rsvps DROP CONSTRAINT IF EXISTS meeting_rsvps_meeting_user_unique;
ALTER TABLE IF EXISTS ONLY public.meeting_ratings DROP CONSTRAINT IF EXISTS meeting_ratings_pkey;
ALTER TABLE IF EXISTS ONLY public.meeting_ratings DROP CONSTRAINT IF EXISTS meeting_ratings_meeting_user_unique;
ALTER TABLE IF EXISTS ONLY public.knack_sync_runs DROP CONSTRAINT IF EXISTS knack_sync_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.knack_sync_log DROP CONSTRAINT IF EXISTS knack_sync_log_pkey;
ALTER TABLE IF EXISTS ONLY public.knack_routings_snapshot DROP CONSTRAINT IF EXISTS knack_routings_snapshot_pkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_pkey;
ALTER TABLE IF EXISTS ONLY public.headlines DROP CONSTRAINT IF EXISTS headlines_pkey;
ALTER TABLE IF EXISTS ONLY public.core_values DROP CONSTRAINT IF EXISTS core_values_pkey;
DROP TABLE IF EXISTS public.vto;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.todos;
DROP TABLE IF EXISTS public.teams;
DROP TABLE IF EXISTS public.team_settings;
DROP TABLE IF EXISTS public.task_pool;
DROP TABLE IF EXISTS public.stations;
DROP TABLE IF EXISTS public.station_default_operators;
DROP TABLE IF EXISTS public.shift_sessions;
DROP TABLE IF EXISTS public.shift_events;
DROP TABLE IF EXISTS public.shift_assignments;
DROP TABLE IF EXISTS public.seats;
DROP TABLE IF EXISTS public.scorecard_metrics;
DROP TABLE IF EXISTS public.scorecard_entries;
DROP TABLE IF EXISTS public.rocks;
DROP TABLE IF EXISTS public.rock_subtasks;
DROP TABLE IF EXISTS public.rock_activity;
DROP TABLE IF EXISTS public.processes;
DROP TABLE IF EXISTS public.pm_schedules;
DROP TABLE IF EXISTS public.people_ratings;
DROP TABLE IF EXISTS public.meetings;
DROP TABLE IF EXISTS public.meeting_rsvps;
DROP TABLE IF EXISTS public.meeting_ratings;
DROP TABLE IF EXISTS public.knack_sync_runs;
DROP TABLE IF EXISTS public.knack_sync_log;
DROP TABLE IF EXISTS public.knack_routings_snapshot;
DROP TABLE IF EXISTS public.issues;
DROP TABLE IF EXISTS public.headlines;
DROP TABLE IF EXISTS public.core_values;
DROP FUNCTION IF EXISTS public.rls_auto_enable();
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.todo_status;
DROP TYPE IF EXISTS public.task_pool_status;
DROP TYPE IF EXISTS public.task_pool_source;
DROP TYPE IF EXISTS public.station_kind;
DROP TYPE IF EXISTS public.shift_event_kind;
DROP TYPE IF EXISTS public.scorecard_comparator;
DROP TYPE IF EXISTS public.rsvp_status;
DROP TYPE IF EXISTS public.rock_status;
DROP TYPE IF EXISTS public.rock_activity_kind;
DROP TYPE IF EXISTS public.people_rating_value;
DROP TYPE IF EXISTS public.meeting_type;
DROP TYPE IF EXISTS public.meeting_status;
DROP TYPE IF EXISTS public.issue_status;
DROP TYPE IF EXISTS public.issue_list;
DROP TYPE IF EXISTS public.headline_kind;
DROP SCHEMA IF EXISTS public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: headline_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.headline_kind AS ENUM (
    'customer',
    'employee'
);


--
-- Name: issue_list; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.issue_list AS ENUM (
    'short_term',
    'long_term'
);


--
-- Name: issue_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.issue_status AS ENUM (
    'open',
    'solved',
    'dropped'
);


--
-- Name: meeting_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.meeting_status AS ENUM (
    'draft',
    'live',
    'concluded'
);


--
-- Name: meeting_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.meeting_type AS ENUM (
    'L10',
    'quarterly',
    'annual'
);


--
-- Name: people_rating_value; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.people_rating_value AS ENUM (
    'plus',
    'plus_minus',
    'minus'
);


--
-- Name: rock_activity_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rock_activity_kind AS ENUM (
    'status_change',
    'progress',
    'comment',
    'subtask',
    'mention'
);


--
-- Name: rock_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rock_status AS ENUM (
    'on_track',
    'off_track',
    'done'
);


--
-- Name: rsvp_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rsvp_status AS ENUM (
    'attending',
    'declined',
    'tentative'
);


--
-- Name: scorecard_comparator; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.scorecard_comparator AS ENUM (
    'gte',
    'lte',
    'eq',
    'range'
);


--
-- Name: shift_event_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.shift_event_kind AS ENUM (
    'job_started',
    'job_paused',
    'job_resumed',
    'job_completed',
    'pm_performed',
    'issue_noted',
    'waste_logged',
    'task_completed',
    'operator_moved',
    'note'
);


--
-- Name: station_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.station_kind AS ENUM (
    'printer',
    'cad',
    'rotary',
    'gluer',
    'handwork',
    'shipping'
);


--
-- Name: task_pool_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_pool_source AS ENUM (
    'hub',
    'eos_todo'
);


--
-- Name: task_pool_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_pool_status AS ENUM (
    'open',
    'in_progress',
    'done',
    'archived'
);


--
-- Name: todo_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.todo_status AS ENUM (
    'open',
    'done'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'leader',
    'member'
);


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: core_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.core_values (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    order_idx integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: headlines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.headlines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    kind public.headline_kind NOT NULL,
    text text NOT NULL,
    author_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    title text NOT NULL,
    description text,
    owner_id uuid,
    list public.issue_list DEFAULT 'short_term'::public.issue_list NOT NULL,
    status public.issue_status DEFAULT 'open'::public.issue_status NOT NULL,
    solved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    dropped_at timestamp without time zone,
    source_metric_id uuid
);


--
-- Name: knack_routings_snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knack_routings_snapshot (
    knack_record_id text NOT NULL,
    knack_run_id text,
    job_number text,
    customer text,
    item_name text,
    routing_step text NOT NULL,
    station_key text NOT NULL,
    complete boolean NOT NULL,
    art_ready boolean NOT NULL,
    material_ready boolean NOT NULL,
    routing_is_ready boolean NOT NULL,
    production_priority integer,
    high_priority boolean DEFAULT false NOT NULL,
    sheets_needed integer,
    sheets_produced integer,
    sheets_received integer,
    waste_external integer,
    waste_internal integer,
    issue_notes text,
    wc_notes_to_prod text,
    wc_notes_by_prod text,
    run_due_date date,
    routing_complete_at timestamp without time zone,
    fetched_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: knack_sync_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knack_sync_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    synced_at timestamp without time zone DEFAULT now() NOT NULL,
    weeks_updated integer NOT NULL,
    weeks_requested integer NOT NULL,
    duration_ms integer NOT NULL,
    ok boolean NOT NULL
);


--
-- Name: knack_sync_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knack_sync_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind text NOT NULL,
    synced_at timestamp without time zone DEFAULT now() NOT NULL,
    status text NOT NULL,
    error_message text,
    fetched integer,
    inserted integer,
    hidden_skipped integer,
    duration_ms integer
);


--
-- Name: meeting_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL
);


--
-- Name: meeting_rsvps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status public.rsvp_status DEFAULT 'tentative'::public.rsvp_status NOT NULL,
    responded_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: meetings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meetings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    type public.meeting_type DEFAULT 'L10'::public.meeting_type NOT NULL,
    started_at timestamp without time zone DEFAULT now() NOT NULL,
    ended_at timestamp without time zone,
    rating_avg numeric,
    attendees jsonb DEFAULT '[]'::jsonb NOT NULL,
    ai_summary_md text,
    teams_posted_at timestamp without time zone,
    status public.meeting_status DEFAULT 'draft'::public.meeting_status NOT NULL,
    scheduled_for timestamp without time zone,
    cascading_message text,
    previous_cascading_message text
);


--
-- Name: people_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.people_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    core_value_id uuid,
    gwc_field text,
    rating public.people_rating_value NOT NULL,
    quarter text NOT NULL
);


--
-- Name: pm_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    station_id uuid NOT NULL,
    label text NOT NULL,
    cadence_days integer NOT NULL,
    last_done_at date
);


--
-- Name: processes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    title text NOT NULL,
    owner_id uuid,
    steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    description text,
    order_idx integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: rock_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rock_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rock_id uuid NOT NULL,
    actor_id uuid NOT NULL,
    kind public.rock_activity_kind NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: rock_subtasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rock_subtasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rock_id uuid NOT NULL,
    title text NOT NULL,
    done boolean DEFAULT false NOT NULL,
    due_date date,
    order_idx integer DEFAULT 0 NOT NULL
);


--
-- Name: rocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    title text NOT NULL,
    description text,
    owner_id uuid NOT NULL,
    quarter text NOT NULL,
    status public.rock_status DEFAULT 'on_track'::public.rock_status NOT NULL,
    progress_pct integer DEFAULT 0 NOT NULL,
    due_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: scorecard_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scorecard_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metric_id uuid NOT NULL,
    week_start date NOT NULL,
    value numeric,
    note text
);


--
-- Name: scorecard_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scorecard_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    name text NOT NULL,
    owner_id uuid NOT NULL,
    goal numeric,
    comparator public.scorecard_comparator DEFAULT 'gte'::public.scorecard_comparator NOT NULL,
    goal_min numeric,
    goal_max numeric,
    unit text,
    order_idx integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: seats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    title text NOT NULL,
    roles jsonb DEFAULT '[]'::jsonb NOT NULL,
    parent_seat_id uuid,
    person_id uuid,
    gwc_gets_it boolean,
    gwc_wants_it boolean,
    gwc_capacity boolean,
    order_idx integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: shift_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shift_session_id uuid NOT NULL,
    station_id uuid NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: shift_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shift_session_id uuid NOT NULL,
    station_id uuid,
    kind public.shift_event_kind NOT NULL,
    payload jsonb NOT NULL,
    occurred_at timestamp without time zone DEFAULT now() NOT NULL,
    recorded_by uuid,
    related_knack_job_id text
);


--
-- Name: shift_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    date date NOT NULL,
    shift_number integer NOT NULL,
    opened_by uuid,
    opened_at timestamp without time zone DEFAULT now() NOT NULL,
    closed_at timestamp without time zone,
    handoff_notes text
);


--
-- Name: station_default_operators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.station_default_operators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    station_id uuid NOT NULL,
    user_id uuid NOT NULL,
    priority integer DEFAULT 0 NOT NULL
);


--
-- Name: stations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    name text NOT NULL,
    kind public.station_kind NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    group_label text,
    knack_machine_center_id text,
    archived_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: task_pool; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_pool (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    title text NOT NULL,
    est_minutes integer,
    suggested_station_id uuid,
    status public.task_pool_status DEFAULT 'open'::public.task_pool_status NOT NULL,
    source public.task_pool_source DEFAULT 'hub'::public.task_pool_source NOT NULL,
    source_todo_id uuid,
    assigned_shift_session_id uuid,
    assigned_user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


--
-- Name: team_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_settings (
    team_id uuid NOT NULL,
    teams_webhook_url text
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: todos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.todos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    title text NOT NULL,
    owner_id uuid NOT NULL,
    due_date date NOT NULL,
    status public.todo_status DEFAULT 'open'::public.todo_status NOT NULL,
    source_meeting_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    team_id uuid,
    email text NOT NULL,
    name text,
    avatar_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    profile_color text,
    role public.user_role DEFAULT 'member'::public.user_role NOT NULL
);


--
-- Name: vto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    core_focus_purpose text,
    core_focus_niche text,
    ten_year_target text,
    marketing_strategy_target_market text,
    marketing_strategy_uniques jsonb,
    marketing_strategy_proven_process text,
    marketing_strategy_guarantee text,
    three_year_picture_date date,
    three_year_picture_revenue text,
    three_year_picture_profit text,
    three_year_picture_measurables jsonb,
    one_year_plan_date date,
    one_year_plan_revenue text,
    one_year_plan_profit text,
    one_year_plan_goals jsonb,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: core_values; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.core_values (id, team_id, title, description, order_idx, active) FROM stdin;
8338d454-7f92-4f41-a490-20ceab53e8ad	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Excellence	We strive for quality in all that we do, believing that good is not good enough.	0	t
9f7eb7b2-7e8c-41e1-9a28-e876107fb7e6	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Innovation	We push ourselves to think openly and dream daringly to embrace what's next in an ever-changing world.	1	t
293b096b-bff9-4617-a2c6-c8869e940ab3	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Drive	We work hard to deliver outstanding results, fueled by a desire to succeed and flourish.	2	t
61a49f7c-dc18-4346-b148-f2c126cdb4d6	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Collaboration	We leverage each other's strengths, coming together as a team to collaborate and celebrate.	3	t
ae15bb4b-6d9c-4b3e-b149-b045277f8339	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Integrity	We don't cut corners. We believe what's right isn't always the same as what's easy.	4	t
e36d6954-6545-4cb4-ba4e-ca3a3bf2a595	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Caring	We seek to serve each other, recognizing that we are real people with real lives, navigating the world with unique dreams and challenges.	5	t
\.


--
-- Data for Name: headlines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.headlines (id, meeting_id, kind, text, author_id, created_at) FROM stdin;
25325218-5d79-4781-b198-7091e0d5468c	277d43f2-9d4e-4d03-a787-7e7a3d40aefa	customer	Harbor 3d Orange solution	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-04-22 14:42:34.490294
64546956-14cc-44a4-998a-3fc530f8329b	277d43f2-9d4e-4d03-a787-7e7a3d40aefa	employee	Victor assesment/solution	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-04-22 14:42:57.391375
482d04ea-6e04-4157-9a98-3473898a1e8e	277d43f2-9d4e-4d03-a787-7e7a3d40aefa	employee	reviews/pay - Kyle asking for reviews	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-04-22 14:43:51.153921
\.


--
-- Data for Name: issues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.issues (id, team_id, title, description, owner_id, list, status, solved_at, created_at, dropped_at, source_metric_id) FROM stdin;
1074863b-5a37-4def-b44f-faf213ac5cbc	\N	Scorecard: On-Time Delivery % missed goal	\N	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	short_term	solved	2026-04-21 21:03:21.646	2026-04-21 21:02:04.285789	\N	\N
21de1bf9-839d-49b7-9821-37443c3968d9	\N	Scorecard: Weekly Revenue missed goal	\N	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	short_term	dropped	\N	2026-04-21 21:02:00.792008	2026-04-21 21:05:05.378	\N
eb01d149-3df3-4579-a70c-5cfa48818885	\N	Scorecard: Weekly Revenue missed goal	\N	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	short_term	dropped	\N	2026-04-21 21:02:03.244787	2026-04-21 21:05:06.494	\N
ffa1c51b-f012-4853-a40e-4ffda5153c73	\N	Scorecard: Parent Jobs Invoiced missed goal	\N	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	short_term	dropped	\N	2026-04-21 21:02:05.032022	2026-04-21 21:05:07.499	\N
c1ad7954-2189-4f49-8880-d4814ad3f4e2	\N	Scorecard: Parent Jobs Invoiced missed goal	\N	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	short_term	dropped	\N	2026-04-21 21:02:07.461227	2026-04-21 21:05:08.557	\N
f0e8eddc-596b-4645-b19d-2219f85d186b	\N	Scorecard: Runs Completed missed goal	\N	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	short_term	dropped	\N	2026-04-21 21:02:08.528747	2026-04-21 21:05:10.236	\N
045a6b30-eff2-435e-a959-b182039605e1	\N	Controller/Floor Lead hire	\N	a9f461f0-251a-41c9-957c-86e948e90b88	short_term	open	\N	2026-04-29 14:23:47.566111	\N	\N
9102ed03-0d3c-4e15-b262-a6bc378fae7f	\N	Team wide incentives	\N	c3978bd3-49bd-4f8d-bda1-e428d36d6c20	short_term	open	\N	2026-04-29 14:28:03.162268	\N	\N
1e02e360-014b-4de9-9017-0e3ab4a086bb	\N	Production Accountability/Point System	\N	2e61c68f-1867-4706-96d4-d60762dc3b99	short_term	open	\N	2026-04-29 14:28:51.985358	\N	\N
\.


--
-- Data for Name: knack_routings_snapshot; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.knack_routings_snapshot (knack_record_id, knack_run_id, job_number, customer, item_name, routing_step, station_key, complete, art_ready, material_ready, routing_is_ready, production_priority, high_priority, sheets_needed, sheets_produced, sheets_received, waste_external, waste_internal, issue_notes, wc_notes_to_prod, wc_notes_by_prod, run_due_date, routing_complete_at, fetched_at) FROM stdin;
6a05ba5018731982c647538f	69f890e66d087d448ac2b5f3		HH Global	HH7310.05R2 Side Graphic	SHIPPED	shipping	f	t	t	f	20	f	2	0	0	\N	\N				2026-06-16	\N	2026-05-14 18:19:10.19713
6a05ba5118731982c647539c	69f890e66d087d448ac2b5f3		HH Global	HH7310.05R2 Side Graphic	SHIP READY	shipping	f	t	t	f	20	f	2	0	0	\N	\N				2026-06-16	\N	2026-05-14 18:19:10.19713
6a05ba5218731982c64753a8	69f890e66d087d448ac2b5f3		HH Global	HH7310.05R2 Side Graphic	SHIP PREP	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2026-06-16	\N	2026-05-14 18:19:10.19713
6a04a45962f3688b4c8f1198	69cd26f538ae24cfaa762f55		ColorHub	Hornady Floor Display - Header (A)	PRINT - Durst	press_2	f	t	t	f	2	f	34	0	183	\N	\N		Print 40 sheets -TV		2026-05-08	\N	2026-05-14 18:19:10.19713
6a04a29544dbf948567005bf	69cd26f538ae24cfaa762f55		ColorHub	Hornady Floor Display - Header (A)	SHIP READY	shipping	f	t	t	f	20	f	34	0	183	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
6a04a29644dbf948567005cb	69cd26f538ae24cfaa762f55		ColorHub	Hornady Floor Display - Header (A)	SHIP PREP	shipping	f	t	t	f	20	f	34	0	183	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
6a04a29844dbf94856701b8a	69cd26f538ae24cfaa762f55		ColorHub	Hornady Floor Display - Header (A)	CAD	cad	f	t	t	f	20	f	34	0	183	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
6a04a29944dbf94856701d7f	69cd26f538ae24cfaa762f55		ColorHub	Hornady Floor Display - Header (A)	PRINT - Durst	press_2	f	t	t	t	2	f	34	0	183	\N	\N		Print 40 sheets -TV		2026-05-08	\N	2026-05-14 18:19:10.19713
6a04a29344dbf94856700021	69cd26f538ae24cfaa762f55		ColorHub	Hornady Floor Display - Header (A)	SHIPPED	shipping	f	t	t	f	20	f	34	0	183	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
6a037d55ed0c1adb77c15a01	69fa1fd787c027e7cfea62b5		Landaal Packaging - Flint	WSTPOP260363-01 LEFT SIDE PANEL	SHIPPED	shipping	f	t	t	f	20	f	236	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037d56ed0c1adb77c15a0d	69fa1fd787c027e7cfea62b5		Landaal Packaging - Flint	WSTPOP260363-01 LEFT SIDE PANEL	SHIP READY	shipping	f	t	t	f	20	f	236	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037d57ed0c1adb77c15a19	69fa1fd787c027e7cfea62b5		Landaal Packaging - Flint	WSTPOP260363-01 LEFT SIDE PANEL	SHIP PREP	shipping	f	t	t	f	20	f	236	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037d58ed0c1adb77c15a25	69fa1fd787c027e7cfea62b5		Landaal Packaging - Flint	WSTPOP260363-01 LEFT SIDE PANEL	CAD	cad	f	t	t	t	20	f	236	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037d0b73a25bdb35063ec4	69fa2026886e3a0a8640ea21		Landaal Packaging - Flint	WSTPOP260363-02 RIGHT SIDE PANEL	SHIPPED	shipping	f	t	t	f	20	f	236	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037d0c73a25bdb35063ed0	69fa2026886e3a0a8640ea21		Landaal Packaging - Flint	WSTPOP260363-02 RIGHT SIDE PANEL	SHIP READY	shipping	f	t	t	f	20	f	236	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037d0e73a25bdb350653a4	69fa2026886e3a0a8640ea21		Landaal Packaging - Flint	WSTPOP260363-02 RIGHT SIDE PANEL	SHIP PREP	shipping	f	t	t	f	20	f	236	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037d0f73a25bdb350653b0	69fa2026886e3a0a8640ea21		Landaal Packaging - Flint	WSTPOP260363-02 RIGHT SIDE PANEL	CAD	cad	f	t	t	t	20	f	236	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037843911533d7525b5b00	69fa1e5f5086301a71f57adf		Landaal Packaging - Flint	WSTPOP250582-16CH WORDS LUGO	SHIPPED	shipping	f	t	t	f	20	f	27	0	0	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037845911533d7525b5b29	69fa1e5f5086301a71f57adf		Landaal Packaging - Flint	WSTPOP250582-16CH WORDS LUGO	SHIP READY	shipping	f	t	t	f	20	f	27	0	0	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037846911533d7525b5b37	69fa1e5f5086301a71f57adf		Landaal Packaging - Flint	WSTPOP250582-16CH WORDS LUGO	SHIP PREP	shipping	f	t	t	f	20	f	27	0	0	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037849911533d7525b7fa7	69fa1e5f5086301a71f57adf		Landaal Packaging - Flint	WSTPOP250582-16CH WORDS LUGO	CAD	cad	f	t	t	t	20	f	27	0	0	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a03777f3f3959e643453119	69fa1d2ca39125b742923830		Landaal Packaging - Flint	WSTPOP260363-13 CENTER LUGON	SHIPPED	shipping	f	t	t	f	20	f	118	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a0377803f3959e643453125	69fa1d2ca39125b742923830		Landaal Packaging - Flint	WSTPOP260363-13 CENTER LUGON	SHIP READY	shipping	f	t	t	f	20	f	118	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a0377823f3959e643453131	69fa1d2ca39125b742923830		Landaal Packaging - Flint	WSTPOP260363-13 CENTER LUGON	SHIP PREP	shipping	f	t	t	t	20	f	118	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037717fac1c3e489056eae	69fa1ccfcaedff0208ca99c5		Landaal Packaging - Flint	WSTPOP250582-11CH CENTER PANEL	SHIPPED	shipping	f	t	t	f	20	f	236	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a037719fac1c3e489056eba	69fa1ccfcaedff0208ca99c5		Landaal Packaging - Flint	WSTPOP250582-11CH CENTER PANEL	SHIP READY	shipping	f	t	t	f	20	f	236	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a03771bfac1c3e489056ec6	69fa1ccfcaedff0208ca99c5		Landaal Packaging - Flint	WSTPOP250582-11CH CENTER PANEL	SHIP PREP	shipping	f	t	t	t	20	f	236	0	997	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
6a034b4d911533d75232eeba	6a0346a973a25bdb353adfc2		HH Global	HH7413.04 Side Graphics	SHIPPED	shipping	f	t	t	f	20	f	45	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
6a034b4f911533d75232eec7	6a0346a973a25bdb353adfc2		HH Global	HH7413.04 Side Graphics	SHIP READY	shipping	f	t	t	f	20	f	45	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
6a034b50911533d75232eed3	6a0346a973a25bdb353adfc2		HH Global	HH7413.04 Side Graphics	SHIP PREP	shipping	f	t	t	f	20	f	45	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
6a034b52911533d75232eedf	6a0346a973a25bdb353adfc2		HH Global	HH7413.04 Side Graphics	CAD	cad	f	t	t	f	20	f	45	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
6a034b53911533d75232eeeb	6a0346a973a25bdb353adfc2		HH Global	HH7413.04 Side Graphics	PRINT - Durst	press_2	f	t	t	t	22	f	45	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69fcda645138a02a2d2443d6	69cd265623cce0cdb14f0085		ColorHub	Hornady Floor Display - Tray	SHIP PREP	shipping	f	t	t	f	20	f	300	0	346	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcda665138a02a2d245123	69cd265623cce0cdb14f0085		ColorHub	Hornady Floor Display - Tray	CAD	cad	f	t	t	f	5	f	300	0	346	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcda6a5138a02a2d248341	69cd265623cce0cdb14f0085		ColorHub	Hornady Floor Display - Tray	PRINT - Durst	press_2	f	t	t	t	5	f	300	106	346	\N	\N		Print 105 sheets -TV<br />PRINT ON KEMI SIDE		2026-05-08	\N	2026-05-14 18:19:10.19713
69fcda605138a02a2d240d45	69cd265623cce0cdb14f0085		ColorHub	Hornady Floor Display - Tray	SHIPPED	shipping	f	t	t	f	20	f	300	0	346	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcda625138a02a2d243936	69cd265623cce0cdb14f0085		ColorHub	Hornady Floor Display - Tray	SHIP READY	shipping	f	t	t	f	20	f	300	0	346	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd84d8eb8f079b8f64f64	69cd26c908382f5d560fa336		ColorHub	Hornady Floor Display - Shelf	SHIPPED	shipping	f	t	t	f	20	f	167	0	192	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd84f8eb8f079b8f64f70	69cd26c908382f5d560fa336		ColorHub	Hornady Floor Display - Shelf	SHIP READY	shipping	f	t	t	f	20	f	167	0	192	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd8508eb8f079b8f64f7d	69cd26c908382f5d560fa336		ColorHub	Hornady Floor Display - Shelf	SHIP PREP	shipping	f	t	t	f	20	f	167	0	192	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd8528eb8f079b8f64f89	69cd26c908382f5d560fa336		ColorHub	Hornady Floor Display - Shelf	CAD	cad	f	t	t	f	5	f	167	0	192	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd8538eb8f079b8f64f95	69cd26c908382f5d560fa336		ColorHub	Hornady Floor Display - Shelf	PRINT - Durst	press_2	f	t	t	t	3	f	167	106	192	\N	\N		Print 60 sheets -TV<br />PRINT ON KEMI SIDE		2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd877282f886af41a0943	69cd260a92be8d92434bf457		ColorHub	Hornady Floor Display - Base	SHIPPED	shipping	f	t	t	f	20	f	300	0	339	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd879282f886af41a094f	69cd260a92be8d92434bf457		ColorHub	Hornady Floor Display - Base	SHIP READY	shipping	f	t	t	f	20	f	300	0	339	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd87a282f886af41a095b	69cd260a92be8d92434bf457		ColorHub	Hornady Floor Display - Base	SHIP PREP	shipping	f	t	t	f	20	f	300	0	339	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd87c282f886af41a0968	69cd260a92be8d92434bf457		ColorHub	Hornady Floor Display - Base	CAD	cad	f	t	t	f	5	f	300	0	339	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd87d282f886af41a0a3e	69cd260a92be8d92434bf457		ColorHub	Hornady Floor Display - Base	PRINT - Durst	press_2	f	t	t	t	5	f	300	106	339	\N	\N		Print 105 sheets -TV<br />PRINT ON KEMI SIDE		2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd75a3ef13fd20f61d13a	69cd2694235a94ee0ff0e1bc		ColorHub	Hornady Floor Display - Divider	SHIPPED	shipping	f	t	t	f	20	f	100	0	136	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd75c3ef13fd20f61d146	69cd2694235a94ee0ff0e1bc		ColorHub	Hornady Floor Display - Divider	SHIP READY	shipping	f	t	t	f	20	f	100	0	136	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd75d3ef13fd20f61d152	69cd2694235a94ee0ff0e1bc		ColorHub	Hornady Floor Display - Divider	SHIP PREP	shipping	f	t	t	f	20	f	100	0	136	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fcd75f3ef13fd20f61e311	69cd2694235a94ee0ff0e1bc		ColorHub	Hornady Floor Display - Divider	CAD	cad	f	t	t	t	5	f	100	0	136	\N	\N				2026-05-08	\N	2026-05-14 18:19:10.19713
69fca8a96f3fd30581ae5773	69f36b7d1f6db22890e7fc20		HH Global	HH7338-M Kroger Bausch AREDS 3 Gravity Feed	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69fa1dfa3327ade29352f008	69fa1df7c9ce9cd4b8c6d9cc		Landaal Packaging - Flint	WSTPOP250582-14CH LUGON BRACKET	SHIP PREP	shipping	f	t	t	t	20	f	30	0	0	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
69fa1dfa70c4e522bee2b310	69fa1df7c9ce9cd4b8c6d9cc		Landaal Packaging - Flint	WSTPOP250582-14CH LUGON BRACKET	SHIP READY	shipping	f	t	t	f	20	f	30	0	0	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
69fa1dfe6cf76101da8da4e5	69fa1df7c9ce9cd4b8c6d9cc		Landaal Packaging - Flint	WSTPOP250582-14CH LUGON BRACKET	SHIPPED	shipping	f	t	t	f	20	f	30	0	0	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
69fa1f7b21c0cacd6bbf1a23	69fa1f784135748ce4f7ec8d		Landaal Packaging - Flint	WSTPOP250582-18CH TXT LUGON BRKT	SHIP PREP	shipping	f	t	t	t	20	f	14	0	0	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
69fa1f7bee4b517b4a9e6324	69fa1f784135748ce4f7ec8d		Landaal Packaging - Flint	WSTPOP250582-18CH TXT LUGON BRKT	SHIP READY	shipping	f	t	t	f	20	f	14	0	0	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
69fa1f7e5842a3d04ce30b0c	69fa1f784135748ce4f7ec8d		Landaal Packaging - Flint	WSTPOP250582-18CH TXT LUGON BRKT	SHIPPED	shipping	f	t	t	f	20	f	14	0	0	\N	\N				2026-05-14	\N	2026-05-14 18:19:10.19713
69f8eb322d5e8dac6167e405	69f36d270a71326b2ae3daa6		Grandville Printing Company	OS590EA Job: 261284-2	SHIPPED	shipping	f	t	t	f	20	f	60	0	0	\N	\N				2026-05-07	\N	2026-05-14 18:19:10.19713
69f8eb352d5e8dac61680727	69f36d270a71326b2ae3daa6		Grandville Printing Company	OS590EA Job: 261284-2	SHIP READY	shipping	f	t	t	f	20	f	60	0	0	\N	\N				2026-05-07	\N	2026-05-14 18:19:10.19713
69f8eb3b2d5e8dac616861dc	69f36d270a71326b2ae3daa6		Grandville Printing Company	OS590EA Job: 261284-2	SHIP PREP	shipping	f	t	t	t	20	f	60	0	0	\N	\N				2026-05-07	\N	2026-05-14 18:19:10.19713
69f3a032ede16398c1f14f61	69f21e29b133e00868a75d1c		HH Global	HH7420-M Kroger Maesa Mix Bar Skinny Tower	GLUE	gluer_tape	f	t	t	t	20	f	2	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69f39f3085d4dc5509c464d3	69f21e29b133e00868a75d1c		HH Global	HH7420-M Kroger Maesa Mix Bar Skinny Tower	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69f395647e79327d44217c1a	69f21f9090e7fc72ced38355		HH Global	IC1927-M Poland Spring Evergreen Pallet Topper	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2026-05-12	\N	2026-05-14 18:19:10.19713
69dfe06bdc46884c41f17fa3	69dfdfd37038cbd5e5f9f4a9		HH Global	HH7413.04 Side Graphics	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69dfe025d79e29b1702686f5	69dfdfcbe9b28e79b3c40437		HH Global	HH7413.06 Header	SHIPPED	shipping	f	t	t	f	20	f	280	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69dfe027d79e29b17026a83a	69dfdfcbe9b28e79b3c40437		HH Global	HH7413.06 Header	SHIP READY	shipping	f	t	t	f	20	f	280	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69dfe0287038cbd5e5fc9518	69de94a95d5468ec6ec1aac7		HH Global	HH7413.04 Side Graphics	SHIPPED	shipping	f	t	t	f	20	f	560	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69dfe029d79e29b17026a846	69dfdfcbe9b28e79b3c40437		HH Global	HH7413.06 Header	SHIP PREP	shipping	f	t	t	f	20	f	280	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69dfe02a7038cbd5e5fca1aa	69de94a95d5468ec6ec1aac7		HH Global	HH7413.04 Side Graphics	SHIP READY	shipping	f	t	t	f	20	f	560	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69dfe02b7038cbd5e5fcac28	69de94a95d5468ec6ec1aac7		HH Global	HH7413.04 Side Graphics	SHIP PREP	shipping	f	t	t	f	20	f	560	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69dfe02bd79e29b17026a852	69dfdfcbe9b28e79b3c40437		HH Global	HH7413.06 Header	CAD	cad	f	t	t	t	20	f	280	0	0	\N	\N				2026-05-18	\N	2026-05-14 18:19:10.19713
69dfe02d7038cbd5e5fcb95e	69de94a95d5468ec6ec1aac7		HH Global	HH7413.04 Side Graphics	CAD	cad	f	t	t	t	20	f	560	477	0	0	3			1 pallet done @ 230pcs<br />Need 83 more pieces for ship quantity. <br />Have 477/560 cut. LT 05/14/26	2026-05-18	\N	2026-05-14 18:19:10.19713
69dfc2fa6c0c82b2ee03cbae	69dfc1a641960faaccfdea78		Gilson Graphics	Brat Header	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2026-04-29	\N	2026-05-14 18:19:10.19713
69dfc23f41960faacc01344c	69dfc1953db3ad2551783fb5		Gilson Graphics	Brat POP Base	SHIPPED	shipping	f	t	t	t	20	f	3	0	0	\N	\N				2026-04-29	\N	2026-05-14 18:19:10.19713
69de54be193fe32d9aef80f1	69de51043b2c9b81f24b7301		Grandville Printing Company	Little Green Mini - OS590EA	SHIPPED	shipping	f	t	t	f	20	f	2	0	0	\N	\N				2026-04-20	\N	2026-05-14 18:19:10.19713
69de54bf193fe32d9aef80fd	69de51043b2c9b81f24b7301		Grandville Printing Company	Little Green Mini - OS590EA	SHIP READY	shipping	f	t	t	f	20	f	2	0	0	\N	\N				2026-04-20	\N	2026-05-14 18:19:10.19713
69de54c0193fe32d9aef8109	69de51043b2c9b81f24b7301		Grandville Printing Company	Little Green Mini - OS590EA	SHIP PREP	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2026-04-20	\N	2026-05-14 18:19:10.19713
69cfdb7e2153dfac225ce899	69cfda2bb34973ff22183815		HH Global	IC1910.30R1 V1 Pallet Topper V1	SHIPPED	shipping	f	t	t	t	20	f	14	0	250	\N	\N				2026-04-16	\N	2026-05-14 18:19:10.19713
69b2f83fb8554ec3ecca8a53	69b2f717708328ae41f00f71		HH Global	HH7382.04 Graphic Panel	SHIPPED	shipping	f	t	t	t	20	f	1	0	0	\N	\N				2026-03-31	\N	2026-05-14 18:19:10.19713
69b1682aa202e946ad2bea40	69b167f963b52e47b15ded81		Gilson Graphics	Display Box	SHIPPED	shipping	f	t	t	t	20	f	3	0	0	\N	\N				2026-03-11	\N	2026-05-14 18:19:10.19713
699711a15a83947f716c4af7	69790961a3bbc19c72db5389		Pratt Industries - GR	24-3145 Mapeguard Curb-60 8100501-1 Box P94747	SHIPPED	shipping	f	t	t	t	20	f	97	0	128	\N	\N				2025-09-22	\N	2026-05-14 18:19:10.19713
699711a55a83947f716c4b1b	69790961a3bbc19c72db5389		Pratt Industries - GR	24-3145 Mapeguard Curb-60 8100501-1 Box P94747	GLUE	gluer_tape	f	t	t	t	20	f	97	0	128	\N	\N				2025-09-22	\N	2026-05-14 18:19:10.19713
69970eb455ba6f6ed9327427	697909583f8105d6e40740af		Pratt Industries - GR	P94748- Mapeguard Curb-72 8105501-1 Box-P94748	GLUE	gluer_tape	f	t	t	t	20	f	170	0	200	\N	\N				2025-09-22	\N	2026-05-14 18:19:10.19713
69970ead55ba6f6ed93273dc	697909583f8105d6e40740af		Pratt Industries - GR	P94748- Mapeguard Curb-72 8105501-1 Box-P94748	SHIPPED	shipping	f	t	t	t	20	f	170	0	200	\N	\N				2025-09-22	\N	2026-05-14 18:19:10.19713
698e49a24b77173cd6e15ef2	698e46e961bc479d9994d2f9		Resource Communications	Zini Display Base	SHIPPED	shipping	f	t	t	t	20	f	1	0	0	\N	\N				\N	\N	2026-05-14 18:19:10.19713
698e49a43921df1a427f5dda	698e46eda83d193382bb1cc1		Resource Communications	Zini Display Tray	SHIPPED	shipping	f	t	t	t	20	f	1	0	0	\N	\N				\N	\N	2026-05-14 18:19:10.19713
6977bc16c2c5e57bd254003e	6977bb66f0b5b0c4fb1c1ef2		Kelly Box and Packaging Co	Tailmate Display - Bottom Shelf	SHIPPED	shipping	f	t	t	t	20	f	3	0	0	\N	\N				2026-01-29	\N	2026-05-14 18:19:10.19713
6977bc2134ba695a179d5e9d	6977bb6af0b5b0c4fb1c2dd0		Kelly Box and Packaging Co	Tailmate Display - Top Shelf	SHIPPED	shipping	f	t	t	t	20	f	3	0	0	\N	\N				2026-01-29	\N	2026-05-14 18:19:10.19713
6977bc2ec2c5e57bd2552a36	6977bb6fa1b1dcdf0638b303		Kelly Box and Packaging Co	Tailmate Display - Tray	SHIPPED	shipping	f	t	t	t	20	f	3	0	0	\N	\N				2026-01-29	\N	2026-05-14 18:19:10.19713
6977bc386faab0d47d6cfea2	6977bb74f0b5b0c4fb1c5ff5		Kelly Box and Packaging Co	Tailmate Display - Header	SHIPPED	shipping	f	t	t	t	20	f	1	0	0	\N	\N				2026-01-29	\N	2026-05-14 18:19:10.19713
6977bc406faab0d47d6d993c	6977bb798137afed6737f080		Kelly Box and Packaging Co	Tailmate Display - Shipper	SHIPPED	shipping	f	t	t	t	20	f	5	0	0	\N	\N				2026-01-29	\N	2026-05-14 18:19:10.19713
6977bb9e34ba695a17969342	6977bb618137afed673755f7		Kelly Box and Packaging Co	Tailmate Display - Base	GLUE	gluer_tape	f	t	t	t	20	f	5	0	0	\N	\N				2026-01-29	\N	2026-05-14 18:19:10.19713
6977bb8d34ba695a179590b8	6977bb618137afed673755f7		Kelly Box and Packaging Co	Tailmate Display - Base	SHIPPED	shipping	f	t	t	t	20	f	5	0	0	\N	\N				2026-01-29	\N	2026-05-14 18:19:10.19713
698a9bc4a8fea466b1f9da1d	695d23275f27858fd7ba09df		\N	\N	SHIPPED	shipping	f	t	t	t	20	f	300	0	\N	\N	\N				2026-01-26	\N	2026-05-14 18:19:10.19713
69456787389820207f7a69ca	694564394a41178499f66463		Kelly Box and Packaging Co	57373 GRAPHICS RIGHT Side Master	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-12-22	\N	2026-05-14 18:19:10.19713
6941888338e57f2f6d154a8a	694185c9d717c0752b8b6905		Gilson Graphics	Bath and Body Works Cover	SHIPPED	shipping	f	t	t	t	20	f	200	0	0	\N	\N				2025-12-09	\N	2026-05-14 18:19:10.19713
6941888538e57f2f6d1567f9	694185e11caac8f9ce2a4698		Gilson Graphics	Bath and Body Works Cover	SHIPPED	shipping	f	t	t	f	20	f	200	0	0	\N	\N				2025-12-09	\N	2026-05-14 18:19:10.19713
6941888738e57f2f6d15681a	694185e11caac8f9ce2a4698		Gilson Graphics	Bath and Body Works Cover	SHIP READY	shipping	f	t	t	f	20	f	200	0	0	\N	\N				2025-12-09	\N	2026-05-14 18:19:10.19713
6941888a38e57f2f6d1571ee	694185e11caac8f9ce2a4698		Gilson Graphics	Bath and Body Works Cover	SHIP PREP	shipping	f	t	t	t	20	f	200	0	0	\N	\N				2025-12-09	\N	2026-05-14 18:19:10.19713
6931acdf940a1d437ca764a3	6931ac73f00566695b4b3b9a		ColorHub	New Entrance Sign	SHIPPED	shipping	f	t	t	f	20	f	1	0	0	\N	\N				2025-12-05	\N	2026-05-14 18:19:10.19713
6931ace1940a1d437ca764af	6931ac73f00566695b4b3b9a		ColorHub	New Entrance Sign	SHIP READY	shipping	f	t	t	f	20	f	1	0	0	\N	\N				2025-12-05	\N	2026-05-14 18:19:10.19713
6931ace3940a1d437ca764bb	6931ac73f00566695b4b3b9a		ColorHub	New Entrance Sign	SHIP PREP	shipping	f	t	t	t	20	f	1	0	0	\N	\N				2025-12-05	\N	2026-05-14 18:19:10.19713
69309a4d1bd68eaaafe635ac	69309a181bd68eaaafe525da		ColorHub	Holiday Mailer	SHIPPED	shipping	f	t	t	f	20	f	9	0	0	\N	\N				2025-12-05	\N	2026-05-14 18:19:10.19713
69309a4f1bd68eaaafe63645	69309a181bd68eaaafe525da		ColorHub	Holiday Mailer	SHIP READY	shipping	f	t	t	f	20	f	9	0	0	\N	\N				2025-12-05	\N	2026-05-14 18:19:10.19713
69309a501bd68eaaafe63beb	69309a181bd68eaaafe525da		ColorHub	Holiday Mailer	SHIP PREP	shipping	f	t	t	t	20	f	9	0	0	\N	\N				2025-12-05	\N	2026-05-14 18:19:10.19713
692718998c215469a614bace	692717984ace8a83493f01e1		Gilson Graphics	Bath and Body Works Cover	SHIPPED	shipping	f	t	t	f	20	f	3858	0	4014	\N	\N				2025-12-09	\N	2026-05-14 18:19:10.19713
6927189b8c215469a614c6bd	692717984ace8a83493f01e1		Gilson Graphics	Bath and Body Works Cover	SHIP READY	shipping	f	t	t	f	20	f	3858	0	4014	\N	\N				2025-12-09	\N	2026-05-14 18:19:10.19713
6927189c8c215469a614dc86	692717984ace8a83493f01e1		Gilson Graphics	Bath and Body Works Cover	SHIP PREP	shipping	f	t	t	f	20	f	3858	0	4014	\N	\N				2025-12-09	\N	2026-05-14 18:19:10.19713
6908be9f4d827d0304486b2d	6908be63c13da4034204e3d3		Veritiv Grand Rapids	200402434001 - Boneless Duck Breast-Orig Single	SHIPPED	shipping	f	t	t	f	20	f	56	0	0	\N	\N				2025-09-19	\N	2026-05-14 18:19:10.19713
6908bea24d827d0304486b60	6908be63c13da4034204e3d3		Veritiv Grand Rapids	200402434001 - Boneless Duck Breast-Orig Single	SHIP READY	shipping	f	t	t	f	20	f	56	0	0	\N	\N				2025-09-19	\N	2026-05-14 18:19:10.19713
6908bea54d827d0304486b8b	6908be63c13da4034204e3d3		Veritiv Grand Rapids	200402434001 - Boneless Duck Breast-Orig Single	SHIP PREP	shipping	f	t	t	t	20	f	56	0	0	\N	\N				2025-09-19	\N	2026-05-14 18:19:10.19713
6908ada580f818031d81c837	6901f8571c3bdd0310ea7d34		Resource Communications	Brewt's 3-Can Insert mold	SHIP PREP	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-11-14	\N	2026-05-14 18:19:10.19713
6908ada080f818031d81c7e1	6901f8571c3bdd0310ea7d34		Resource Communications	Brewt's 3-Can Insert mold	SHIPPED	shipping	f	t	t	f	20	f	2	0	0	\N	\N				2025-11-14	\N	2026-05-14 18:19:10.19713
6908ada380f818031d81c809	6901f8571c3bdd0310ea7d34		Resource Communications	Brewt's 3-Can Insert mold	SHIP READY	shipping	f	t	t	f	20	f	2	0	0	\N	\N				2025-11-14	\N	2026-05-14 18:19:10.19713
68f23f1d290f8c02fd1eac6d	68f23f03290f8c02fd1eaba3		Resource Communications	Prowood POP Display	SHIPPED	shipping	f	t	t	f	20	f	1	0	0	\N	\N				2025-10-16	\N	2026-05-14 18:19:10.19713
68f23f1f290f8c02fd1eac7e	68f23f03290f8c02fd1eaba3		Resource Communications	Prowood POP Display	SHIP READY	shipping	f	t	t	f	20	f	1	0	0	\N	\N				2025-10-16	\N	2026-05-14 18:19:10.19713
68f23f21290f8c02fd1eac98	68f23f03290f8c02fd1eaba3		Resource Communications	Prowood POP Display	SHIP PREP	shipping	f	t	t	t	20	f	1	0	0	\N	\N				2025-10-16	\N	2026-05-14 18:19:10.19713
68efae44613f4702f5e212bc	68efadf22fda4802e06a0b88		Gilson Graphics	ASO-250475014 HOL Market Hunter Roof Header	SHIP PREP	shipping	f	t	t	t	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae446cc6d5032593924b	68efadecf145c402ebdad4aa		Gilson Graphics	ASO-250475013 HOL Market Camper Roof Header	SHIP PREP	shipping	f	t	t	t	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae446cc6d5032593924c	68efadf6f74ab202f9e9f3d1		Gilson Graphics	ASO-250475015 HOL Market Range Roof Header	SHIP READY	shipping	f	t	t	f	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae46611e3802f2d2a5b1	68efadfc611e3802f2d2a364		Gilson Graphics	ASO-250475016 HOL Market Angler Roof Header	SHIP READY	shipping	f	t	t	f	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae476cc6d50325939265	68efadf6f74ab202f9e9f3d1		Gilson Graphics	ASO-250475015 HOL Market Range Roof Header	SHIP PREP	shipping	f	t	t	t	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae49611e3802f2d2a603	68efadfc611e3802f2d2a364		Gilson Graphics	ASO-250475016 HOL Market Angler Roof Header	SHIP PREP	shipping	f	t	t	t	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae3c10861c030b3d3d69	68efadccf145c402ebdad302		Gilson Graphics	ASO-250475004 HOL Market Roof Header	SHIPPED	shipping	f	t	t	f	20	f	10	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae3e6cc6d503259391de	68efadecf145c402ebdad4aa		Gilson Graphics	ASO-250475013 HOL Market Camper Roof Header	SHIPPED	shipping	f	t	t	f	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae3f10861c030b3d3d75	68efadccf145c402ebdad302		Gilson Graphics	ASO-250475004 HOL Market Roof Header	SHIP READY	shipping	f	t	t	f	20	f	10	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae3f613f4702f5e212a4	68efadf22fda4802e06a0b88		Gilson Graphics	ASO-250475014 HOL Market Hunter Roof Header	SHIPPED	shipping	f	t	t	f	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae4010861c030b3d3d81	68efadccf145c402ebdad302		Gilson Graphics	ASO-250475004 HOL Market Roof Header	SHIP PREP	shipping	f	t	t	t	20	f	10	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae416cc6d5032593922f	68efadf6f74ab202f9e9f3d1		Gilson Graphics	ASO-250475015 HOL Market Range Roof Header	SHIPPED	shipping	f	t	t	f	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae416cc6d50325939230	68efadecf145c402ebdad4aa		Gilson Graphics	ASO-250475013 HOL Market Camper Roof Header	SHIP READY	shipping	f	t	t	f	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae42613f4702f5e212b0	68efadf22fda4802e06a0b88		Gilson Graphics	ASO-250475014 HOL Market Hunter Roof Header	SHIP READY	shipping	f	t	t	f	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68efae43611e3802f2d2a56b	68efadfc611e3802f2d2a364		Gilson Graphics	ASO-250475016 HOL Market Angler Roof Header	SHIPPED	shipping	f	t	t	f	20	f	3	0	0	\N	\N				2025-09-29	\N	2026-05-14 18:19:10.19713
68e435078ec8f702bb64a83d	68e434d18ec8f702bb64a637		Spartan Graphics, INC.	B-Flute Kemi White 2 Sides 97" x 78	SHIP PREP	shipping	f	t	t	t	20	f	0	0	0	\N	\N				2025-10-01	\N	2026-05-14 18:19:10.19713
68c2b366b606b002dbc80cde	68c2b31185546302e81df98e		HH Global	HH7188H.06 - Header	SHIPPED	shipping	f	t	t	f	20	f	23	0	0	\N	\N				2025-10-08	\N	2026-05-14 18:19:10.19713
68c2b368b606b002dbc80cea	68c2b31185546302e81df98e		HH Global	HH7188H.06 - Header	SHIP READY	shipping	f	t	t	f	20	f	23	0	0	\N	\N				2025-10-08	\N	2026-05-14 18:19:10.19713
68c2b36ab606b002dbc80cf6	68c2b31185546302e81df98e		HH Global	HH7188H.06 - Header	SHIP PREP	shipping	f	t	t	t	20	f	23	0	0	\N	\N				2025-10-08	\N	2026-05-14 18:19:10.19713
68c03de76be8f872860e2365	68c03dcd5fb2987d8687a2cc		Veritiv Grand Rapids	Duck Breast - gloss	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-09-12	\N	2026-05-14 18:19:10.19713
68c03de2204d4072a30bba24	68c03dd26be8f872860e21e0		Veritiv Grand Rapids	Duck Breast - digiflex	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-09-12	\N	2026-05-14 18:19:10.19713
68b70f5908624702b6a99f37	68b70e86b6280902dcdcb54a		Veritiv Grand Rapids	200462714001 - RSTD BDB 2-pack	COAT ONLY PASS - BRN	press_1	f	t	t	f	20	f	2000	0	4573	\N	\N				2025-09-19	\N	2026-05-14 18:19:10.19713
68b70ec5609fb702ef41cee9	68b70e86b6280902dcdcb54a		Veritiv Grand Rapids	200462714001 - RSTD BDB 2-pack	SHIPPED	shipping	f	t	t	t	20	f	2000	0	4573	\N	\N				2025-09-19	\N	2026-05-14 18:19:10.19713
68b70d916ea77d02afbf7c3a	68b70c68d28f5d02fa01ecb6		Veritiv Grand Rapids	200402434001 - Boneless Duck Breast-Orig Single	COAT ONLY PASS - BRN	press_1	f	t	t	f	20	f	750	119	919	\N	\N				2025-09-19	\N	2026-05-14 18:19:10.19713
68b70cbc6ea77d02afbf71cd	68b70c68d28f5d02fa01ecb6		Veritiv Grand Rapids	200402434001 - Boneless Duck Breast-Orig Single	SHIPPED	shipping	f	t	t	t	20	f	750	0	919	\N	\N				2025-09-19	\N	2026-05-14 18:19:10.19713
686d005bd8837102f5da3bf6	686d0028cc428702e3ec43a8		HH Global	IC1562B.01-88158	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-07-11	\N	2026-05-14 18:19:10.19713
68666aa1462dd802cb6fdbc5	6866697f1a3ca602c25f8d8d		HH Global	HH6870H.05V1 Graphic Panel	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-08-04	\N	2026-05-14 18:19:10.19713
6866681d4f983d02f7bbaab8	6866668fe9e31202e1c7ddcf		HH Global	HH6870F.13 Side Graphic Set	SHIPPED	shipping	f	t	t	t	20	f	1	0	0	\N	\N				2025-07-11	\N	2026-05-14 18:19:10.19713
6866680dccdc9303083b7c39	6866668389c27802d5fc8bd4		HH Global	HH6870F.12 Header	SHIPPED	shipping	f	t	t	t	20	f	1	0	0	\N	\N				2025-07-11	\N	2026-05-14 18:19:10.19713
6851881bbdf56002f4d26707	685187d6bdf56002f4d2640f		Packwire	Motis Talon Wedge Mailer	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-06-20	\N	2026-05-14 18:19:10.19713
684c64ee6b73fe02fdb24353	684c62c8c418be02eb2021a6		Resource Communications	669798_48inch_CompositePostSleeveKit	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-06-19	\N	2026-05-14 18:19:10.19713
684c64f29c59bf02d5bef24d	684c62229c59bf02d5beda34		Resource Communications	669797_40in_CompositePostSleeveKit	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-06-19	\N	2026-05-14 18:19:10.19713
684c64f7ef00f102f5497947	684c61af6b73fe02fdb23004		Resource Communications	669794_6ft36in_ContempComposite_Stair	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-06-19	\N	2026-05-14 18:19:10.19713
684c64fbef00f102f549798d	684c6125a0c1040308c3de2c		Resource Communications	669793_ContempRail	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-06-19	\N	2026-05-14 18:19:10.19713
684c63deef00f102f54969a9	684c60c8bf5fca02cc9e9774		Resource Communications	346700_6ft36in_ClassicRail	SHIPPED	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-06-19	\N	2026-05-14 18:19:10.19713
684c42b9a0c1040308c32042	684c40c46f631a0322de5336		Landaal Packaging - Flint	WSTPOP240700-02WV - Heasder Board WEST VIRGINIA	SHIPPED	shipping	f	t	t	t	20	f	5	0	0	\N	\N				2025-06-06	\N	2026-05-14 18:19:10.19713
683f2c2fdbd60802da396390	683f0fcc5679e40300af33db		Landaal Packaging - Flint	WSTPOP250259-15 Fifa Trophy	SHIPPED	shipping	f	t	t	f	20	f	2	0	0	\N	\N				2025-06-05	\N	2026-05-14 18:19:10.19713
683f2c32dbd60802da39639d	683f0fcc5679e40300af33db		Landaal Packaging - Flint	WSTPOP250259-15 Fifa Trophy	SHIP READY	shipping	f	t	t	f	20	f	2	0	0	\N	\N				2025-06-05	\N	2026-05-14 18:19:10.19713
683f2c34dbd60802da3963a9	683f0fcc5679e40300af33db		Landaal Packaging - Flint	WSTPOP250259-15 Fifa Trophy	SHIP PREP	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-06-05	\N	2026-05-14 18:19:10.19713
682ddb00f6276c02d41b7ef1	682dda92813484030be1e9a7		Grand Traverse Container	Pet Loo - BX40057	SHIPPED	shipping	f	t	t	t	20	f	2750	0	2993	\N	\N				2025-06-03	\N	2026-05-14 18:19:10.19713
682ddb05f6276c02d41b7f1b	682dda92813484030be1e9a7		Grand Traverse Container	Pet Loo - BX40057	SHIP PREP	shipping	f	t	t	t	20	f	2750	0	2993	\N	\N				2025-06-03	\N	2026-05-14 18:19:10.19713
68278b3285579302fc102aa3	68278a8a53519e02f3d7f6d9		Akers Packaging - La Porte	AmTab | PSB BOX-PT A	SHIPPED	shipping	f	t	t	f	20	f	263	0	288	\N	\N				2025-05-07	\N	2026-05-14 18:19:10.19713
68278b3585579302fc102aaf	68278a8a53519e02f3d7f6d9		Akers Packaging - La Porte	AmTab | PSB BOX-PT A	SHIP READY	shipping	f	t	t	f	20	f	263	0	288	\N	\N				2025-05-07	\N	2026-05-14 18:19:10.19713
68278b3785579302fc102ac2	68278a8a53519e02f3d7f6d9		Akers Packaging - La Porte	AmTab | PSB BOX-PT A	SHIP PREP	shipping	f	t	t	t	20	f	263	0	288	\N	\N				2025-05-07	\N	2026-05-14 18:19:10.19713
67fd672f7144f30310e2674f	67fd67214365cf02df9cb900		Opus Packaging	240889 - FW Carton 12	SHIPPED	shipping	f	t	t	t	20	f	1	0	0	\N	\N				2025-04-15	\N	2026-05-14 18:19:10.19713
67fd679afbd2e102cbcfae5e	67fd679037ea6602b2469ff5		Opus Packaging	250955 - FW Carton Rack	SHIPPED	shipping	f	t	t	t	20	f	1	0	0	\N	\N				2025-04-15	\N	2026-05-14 18:19:10.19713
67fd6838d3228502b80dd3fa	67fd682e6f03e402efc9feb6		Opus Packaging	251014 - FW Carton 24	SHIPPED	shipping	f	t	t	t	20	f	1	0	0	\N	\N				2025-04-15	\N	2026-05-14 18:19:10.19713
67f6cf8f1e9c4c02cdd168fa	67f6cf80292d8002c6f9874b		Packwire	NEUROPRO MW TEST	SHIPPED	shipping	f	t	t	f	20	f	1	0	0	\N	\N				2025-04-10	\N	2026-05-14 18:19:10.19713
67f6cf921e9c4c02cdd16906	67f6cf80292d8002c6f9874b		Packwire	NEUROPRO MW TEST	SHIP READY	shipping	f	t	t	f	20	f	1	0	0	\N	\N				2025-04-10	\N	2026-05-14 18:19:10.19713
67f6cf941e9c4c02cdd16912	67f6cf80292d8002c6f9874b		Packwire	NEUROPRO MW TEST	SHIP PREP	shipping	f	t	t	t	20	f	1	0	0	\N	\N				2025-04-10	\N	2026-05-14 18:19:10.19713
67f6c78c87056602e3227270	67f6c745e6663602c6930762		Resource Communications	DECKORATORS COLOR SAMPLE	SHIPPED	shipping	f	t	t	f	20	f	2	0	0	\N	\N				2025-04-11	\N	2026-05-14 18:19:10.19713
67f6c78f87056602e3227292	67f6c745e6663602c6930762		Resource Communications	DECKORATORS COLOR SAMPLE	SHIP READY	shipping	f	t	t	f	20	f	2	0	0	\N	\N				2025-04-11	\N	2026-05-14 18:19:10.19713
67f6c79187056602e322729e	67f6c745e6663602c6930762		Resource Communications	DECKORATORS COLOR SAMPLE	SHIP PREP	shipping	f	t	t	t	20	f	2	0	0	\N	\N				2025-04-11	\N	2026-05-14 18:19:10.19713
67dabe98cadd0c032e7127c2	67d9d8de11f910032efd8287		HH Global	HH6777QP.11R5 Header A	SHIPPED	shipping	f	t	t	f	20	f	20	0	0	\N	\N				2025-03-17	\N	2026-05-14 18:19:10.19713
67cee8a90e50a002e2d6e53f	67cee519f2b4f6030cd77baf		Grand Traverse Container	Lucido Sample	SHIPPED	shipping	f	t	t	f	20	f	1	0	0	\N	\N				2025-03-14	\N	2026-05-14 18:19:10.19713
67cee8ab0e50a002e2d6e54b	67cee519f2b4f6030cd77baf		Grand Traverse Container	Lucido Sample	SHIP READY	shipping	f	t	t	f	20	f	1	0	0	\N	\N				2025-03-14	\N	2026-05-14 18:19:10.19713
67cee8ad0e50a002e2d6e557	67cee519f2b4f6030cd77baf		Grand Traverse Container	Lucido Sample	SHIP PREP	shipping	f	t	t	t	20	f	1	0	0	\N	\N				2025-03-14	\N	2026-05-14 18:19:10.19713
679420e8533a86031c35c921	6792360eb6c108030358d0b5		HH Global	HH6850.10V1 40in Outside CoverV1	SHIP READY	shipping	f	t	t	f	20	f	253	0	563	\N	\N				2025-01-10	\N	2026-05-14 18:19:10.19713
679420fac037c102d970e169	6792360eb6c108030358d0b5		HH Global	HH6850.10V1 40in Outside CoverV1	SHIPPED	shipping	f	t	t	f	20	f	253	0	563	\N	\N				2025-01-10	\N	2026-05-14 18:19:10.19713
679420d2b2218f02b219fd55	6792360eb6c108030358d0b5		HH Global	HH6850.10V1 40in Outside CoverV1	SHIP PREP	shipping	f	t	t	t	20	f	253	0	563	\N	\N				2025-01-10	\N	2026-05-14 18:19:10.19713
679236e55804230313e23158	67923615b6c108030358d0f1		HH Global	HH6850.10V2 40in Outside CoverV2	SHIPPED	shipping	f	t	t	f	20	f	253	0	563	\N	\N				2025-01-10	\N	2026-05-14 18:19:10.19713
679236e75804230313e23164	67923615b6c108030358d0f1		HH Global	HH6850.10V2 40in Outside CoverV2	SHIP READY	shipping	f	t	t	f	20	f	253	0	563	\N	\N				2025-01-10	\N	2026-05-14 18:19:10.19713
679236e95804230313e23170	67923615b6c108030358d0f1		HH Global	HH6850.10V2 40in Outside CoverV2	SHIP PREP	shipping	f	t	t	t	20	f	253	0	563	\N	\N				2025-01-10	\N	2026-05-14 18:19:10.19713
6785748322d69c030d419941	678573aa59fea102fa549243		Packwire	Pro Motion 13.25x4.5x2 Mailer	SHIPPED	shipping	f	t	t	t	20	f	42	0	0	\N	\N				2025-01-17	\N	2026-05-14 18:19:10.19713
678573e7e0fc6002c08396a2	678573b422d69c030d4192f3		Packwire	Pro Motion 8.5x4.5x2 Mailer	SHIPPED	shipping	f	t	t	t	20	f	34	0	0	\N	\N				2025-01-17	\N	2026-05-14 18:19:10.19713
\.


--
-- Data for Name: knack_sync_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.knack_sync_log (id, synced_at, weeks_updated, weeks_requested, duration_ms, ok) FROM stdin;
4051958a-043e-44d3-8c60-863f4e222ce5	2026-04-27 15:48:14.116173	1	1	1624	t
d722a286-8da1-4f4d-9293-6466a55424dd	2026-04-27 15:48:14.246046	13	13	8391	t
9ff5f9e8-f904-4e4a-9186-428adf23adaf	2026-04-27 15:48:41.665431	13	13	8975	t
2866209d-c18f-4d8e-b921-bf8f41ed8ff9	2026-04-27 15:49:06.413402	1	1	1751	t
0f310ba6-c479-45ab-a590-201ad7dbd396	2026-04-27 17:49:04.954414	1	1	1416	t
11da7454-f3e6-4057-ba07-09649821f6f8	2026-04-29 12:22:47.97735	1	1	1306	t
c3a1ab68-7399-4d3b-9a46-3c7401e6bd8e	2026-04-29 13:04:48.822427	1	1	1981	t
37b50054-ac65-4291-adad-2c4b6c88fa9b	2026-04-29 13:12:11.806864	1	1	2454	t
25614010-b7e1-4014-bf2e-8fb9c87554ff	2026-04-29 13:35:10.302964	1	1	2568	t
db3d1ff7-085a-427c-8e74-1e4b99955eb6	2026-04-29 13:35:38.971359	13	13	23628	t
f4f779d9-6e9d-4cce-a21b-40b68248a44d	2026-04-29 13:45:57.935101	1	1	2342	t
89142822-2125-4c8a-aa10-64bdae9a2285	2026-04-29 13:46:13.146395	1	1	3025	t
81708737-8d00-4f69-8286-323eeab4dbc0	2026-04-29 13:47:37.95478	1	1	2971	t
0fa90417-c2bd-433a-b65e-a659317f311a	2026-04-29 13:48:08.751489	13	13	26185	t
c546180f-7c19-4df6-a46e-72e0bfbf7e95	2026-04-29 15:00:11.445619	1	1	3275	t
372a40d2-bcd3-4b3f-a5b9-275ec0483971	2026-04-29 15:26:34.523905	1	1	2407	t
97d467ef-8767-4439-86fc-9a3a0228da7f	2026-04-29 15:27:12.026085	13	13	30352	t
6eb89775-9fde-4584-b16a-d9fe1e289284	2026-05-04 20:04:17.265069	1	1	4055	t
b6133447-1613-4808-b61d-7695ca502e4b	2026-05-05 17:08:08.879409	1	1	3628	t
44408e22-e09b-401b-9dd8-ae8b5b96e037	2026-05-06 20:05:04.156126	1	1	4489	t
3a79c374-4edc-48df-9605-e0faa785f6b7	2026-05-11 20:39:50.337647	1	1	2008	t
261742d5-e4ad-45a1-ad12-906df1154329	2026-05-14 18:07:02.395215	1	1	1879	t
\.


--
-- Data for Name: knack_sync_runs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.knack_sync_runs (id, kind, synced_at, status, error_message, fetched, inserted, hidden_skipped, duration_ms) FROM stdin;
8767fae7-df04-4ed5-bdcf-14dce8c54563	floor_routings	2026-05-12 18:20:52.71	ok	\N	189	186	3	1363
9bef6d15-0150-404b-a6aa-e3d9fa4aa800	floor_routings	2026-05-12 18:23:25.89	ok	\N	189	186	3	2116
2368bf29-b0ae-43d5-9662-c5f2f824cba1	floor_routings	2026-05-12 18:34:28.472	ok	\N	189	186	3	1371
4537521e-0d79-44a0-879b-f17778f6d633	floor_routings	2026-05-12 18:34:40.555	ok	\N	189	186	3	1655
e7479b25-5415-4d58-b1b2-777d1069eeef	floor_routings	2026-05-12 18:38:03.107	ok	\N	189	186	3	2201
0d09f87e-c93e-4ad1-bf49-110410bd2501	floor_routings	2026-05-13 00:58:10.414	ok	\N	212	209	3	37924
c1523baf-3329-4a27-80ee-da87adb727d2	floor_routings	2026-05-13 00:58:11.414	ok	\N	212	209	3	2018
0e59f310-41de-41fe-819e-3850c8b45d4e	floor_routings	2026-05-13 13:36:53.554	ok	\N	201	198	3	2869
44800ec4-7db4-4e87-a5cc-7f88a86b0652	floor_routings	2026-05-13 13:36:55.739	ok	\N	201	198	3	5405
7794e1d4-c9de-4239-ad37-9c4d5625d45d	floor_routings	2026-05-13 14:40:00.216	ok	\N	199	196	3	2255
718e66ad-1f10-48cd-9362-0b14b110d340	floor_routings	2026-05-14 18:06:46.678	ok	\N	186	183	3	3167
bed19722-7fe8-4fe5-b4c3-5058e0990bdc	floor_routings	2026-05-14 18:07:00.639	ok	\N	186	183	3	14080
f4278342-d0ce-447b-bf74-3441ef9736d6	floor_routings	2026-05-14 18:19:10.779	ok	\N	186	183	3	2244
\.


--
-- Data for Name: meeting_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meeting_ratings (id, meeting_id, user_id, rating) FROM stdin;
ef0d3ca6-8ae4-451d-bebd-1ac1a6aceb17	277d43f2-9d4e-4d03-a787-7e7a3d40aefa	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	8
163ccb71-1269-4047-bd78-aa310cb6ab61	3bb6f742-775d-4197-a74e-bd926bbffddd	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	5
dcca0934-f873-47f6-ac1c-3bbd5bf5e968	3bb6f742-775d-4197-a74e-bd926bbffddd	2e61c68f-1867-4706-96d4-d60762dc3b99	5
00a9fa27-ca51-40a0-9aef-c3d6c5e6a9bc	3bb6f742-775d-4197-a74e-bd926bbffddd	a9f461f0-251a-41c9-957c-86e948e90b88	5
d274613d-272f-48bf-ac00-48579ef45ab4	3bb6f742-775d-4197-a74e-bd926bbffddd	c3978bd3-49bd-4f8d-bda1-e428d36d6c20	6
\.


--
-- Data for Name: meeting_rsvps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meeting_rsvps (id, meeting_id, user_id, status, responded_at) FROM stdin;
\.


--
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meetings (id, team_id, type, started_at, ended_at, rating_avg, attendees, ai_summary_md, teams_posted_at, status, scheduled_for, cascading_message, previous_cascading_message) FROM stdin;
e13d2bd0-ec99-47be-b397-829e6ff7d6dd	\N	L10	2026-04-29 14:39:14.668677	\N	\N	[]	\N	\N	draft	2026-05-06 14:39:14.499	\N	Reminder to review next hire - floor lead/controller\n
277d43f2-9d4e-4d03-a787-7e7a3d40aefa	\N	L10	2026-04-22 14:25:08.641251	2026-04-22 16:13:48.291	8.0	[{"id": "b2002810-57bd-4e68-8d0c-5db0b9adb1b4", "name": "Hunter Edwards", "email": "h.edwards.327@gmail.com"}, {"id": "c3978bd3-49bd-4f8d-bda1-e428d36d6c20", "name": "Jill Harris", "email": "jill@colorhub.io"}, {"id": "a9f461f0-251a-41c9-957c-86e948e90b88", "name": "Tim Harris", "email": "tim@colorhub.io"}, {"id": "2e61c68f-1867-4706-96d4-d60762dc3b99", "name": "Tyler Valentine", "email": "tyler@colorhub.io"}]	## Meeting Health\n**Team:** Colorhub | **Date:** 2026-04-22 | **Avg Rating:** 8/10\n**Attendees:** Hunter Edwards\n\n---\n\n## Scorecard\n| Metric | Owner | Actual | Goal | Status |\n|---|---|---|---|---|\n| Weekly Revenue | Hunter Edwards | $40,587.50 | $50,000 | 🔴 |\n| Parent Jobs Invoiced | Hunter Edwards | 8 | 10 | 🔴 |\n| Jobs Completed | Hunter Edwards | 6 | 10 | 🔴 |\n\n> ⚠️ All three tracked metrics are red this week.\n\n---\n\n## Rock Pulse\nNo rocks currently on record.\n\n---\n\n## Issues Solved\nNone this meeting.\n\n---\n\n## Headlines\n- 🏢 **Customer:** Harbor 3D Orange solution in progress\n- 👤 **Employee:** Victor assessment/solution underway\n- 👤 **Employee:** Kyle requesting reviews — tied to pay/reviews discussion\n\n---\n\n## Action Items\nNo to-dos recorded this meeting.\n\n---\n\n## Cascading Message\n- Reminder to initiate the **first hire conversation**\n- Discuss and align on **production incentives**	2026-04-22 16:13:55.804	concluded	\N	- reminder for first hire conversation\n- production incentives	\N
3bb6f742-775d-4197-a74e-bd926bbffddd	\N	L10	2026-04-29 14:10:09.634	2026-04-29 14:39:07.546	5.3	[{"id": "b2002810-57bd-4e68-8d0c-5db0b9adb1b4", "name": "Hunter Edwards", "email": "h.edwards.327@gmail.com"}, {"id": "2e61c68f-1867-4706-96d4-d60762dc3b99", "name": "Tyler Valentine", "email": "tyler@colorhub.io"}, {"id": "a9f461f0-251a-41c9-957c-86e948e90b88", "name": "Tim Harris", "email": "tim@colorhub.io"}, {"id": "c3978bd3-49bd-4f8d-bda1-e428d36d6c20", "name": "Jill Harris", "email": "jill@colorhub.io"}]	The team's energy was notably flat this week, with nearly everyone rating the meeting at a 5 and the average sitting at 5.3, which may reflect the broader drag of an underperforming week. Production is the clear concern, with Runs and Jobs Completed both coming in at roughly half their targets — a significant gap that will need a root cause conversation soon if it persists. The cascading reminder around the floor lead/controller hire feels timely, as closing that seat could be a key lever for relieving whatever operational pressure is showing up in the numbers.	2026-04-29 14:39:14.36	concluded	2026-04-29 16:13:55.938	Reminder to review next hire - floor lead/controller\n	- reminder for first hire conversation\n- production incentives
\.


--
-- Data for Name: people_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.people_ratings (id, team_id, subject_id, core_value_id, gwc_field, rating, quarter) FROM stdin;
\.


--
-- Data for Name: pm_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pm_schedules (id, station_id, label, cadence_days, last_done_at) FROM stdin;
\.


--
-- Data for Name: processes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.processes (id, team_id, title, owner_id, steps, description, order_idx, updated_at) FROM stdin;
\.


--
-- Data for Name: rock_activity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rock_activity (id, rock_id, actor_id, kind, payload, created_at) FROM stdin;
1f996539-ff4c-4e88-afdb-9e0321d73019	b38d5551-72fc-4e7c-acf8-1be942ac1ddd	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	subtask	{"action": "added", "subtaskTitle": "Prototype the rock feature"}	2026-04-16 02:43:36.019541
cded06ea-e4af-45e0-babd-9a0509603abd	b38d5551-72fc-4e7c-acf8-1be942ac1ddd	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	subtask	{"action": "added", "subtaskTitle": "add another sub task"}	2026-04-16 02:43:44.01106
405b316a-f076-4457-b738-4cb4813677d2	b38d5551-72fc-4e7c-acf8-1be942ac1ddd	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	comment	{"body": "added sub task, testing functionality", "mentions": []}	2026-04-16 02:45:09.490409
721a3f89-445f-4682-b79c-6182e1ea2278	b38d5551-72fc-4e7c-acf8-1be942ac1ddd	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	status_change	{"status": "done"}	2026-04-21 21:01:20.717001
f7323c9c-3a8f-468e-b08b-d5a28c7e17fc	3de3a2de-e221-41fb-aad3-40c778894fde	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	subtask	{"action": "added", "subtaskTitle": "define metrics using data in knack"}	2026-04-30 16:04:41.600531
4f864457-b6d5-4342-a167-cb13d757af61	3de3a2de-e221-41fb-aad3-40c778894fde	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	subtask	{"action": "added", "subtaskTitle": "create list of realistic, trackable metrics"}	2026-04-30 16:05:29.500762
\.


--
-- Data for Name: rock_subtasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rock_subtasks (id, rock_id, title, done, due_date, order_idx) FROM stdin;
9e5c410f-ebe9-47e0-8702-83334d2ce731	b38d5551-72fc-4e7c-acf8-1be942ac1ddd	add another sub task	t	\N	0
d93f7f8f-f0fe-4ab1-8240-b4275c333652	b38d5551-72fc-4e7c-acf8-1be942ac1ddd	Prototype the rock feature	t	\N	0
b78b6c05-0c81-42be-b307-e74620631691	3de3a2de-e221-41fb-aad3-40c778894fde	define metrics using data in knack	f	\N	0
87d42503-d52f-4306-aeca-697dcf07142e	3de3a2de-e221-41fb-aad3-40c778894fde	create list of realistic, trackable metrics	f	\N	0
\.


--
-- Data for Name: rocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rocks (id, team_id, title, description, owner_id, quarter, status, progress_pct, due_date, created_at, updated_at) FROM stdin;
b38d5551-72fc-4e7c-acf8-1be942ac1ddd	\N	implement new EOS hub	Hunter is tasked with making and implementing a new EOS hub for managing ColorHub	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-Q2	done	100	2026-04-22	2026-04-16 02:42:39.606407	2026-04-21 21:01:20.556
e1ba04c9-78ef-4429-ae56-60f4bf46f268	\N	marketing materials	\N	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-Q2	on_track	0	\N	2026-04-29 14:17:06.397551	2026-04-29 14:17:06.397551
3de3a2de-e221-41fb-aad3-40c778894fde	\N	Personal Production Accountability Metrics	Come up with reliable metrics for each employee to track their performance/adherence to company policies	2e61c68f-1867-4706-96d4-d60762dc3b99	2026-Q2	on_track	0	2026-06-30	2026-04-22 16:18:14.208622	2026-04-30 16:05:29.737
\.


--
-- Data for Name: scorecard_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scorecard_entries (id, metric_id, week_start, value, note) FROM stdin;
cd971356-6884-40ff-bb00-ce949e84cae8	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-03-23	26	\N
70515e83-8955-4eb3-90f3-8fbeab72b358	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-03-16	15	\N
45d4cff6-ff10-4a66-ac24-ad806160f3c9	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-03-16	0	\N
9dfb6e6d-c977-489b-a35f-c5472d71fcbc	1725dc41-e582-48b9-8468-886d9b95b54d	2026-01-26	15	\N
c6477cca-9a7f-4179-a69f-9585585b0d4c	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-01-26	37	\N
de409f9f-3db6-457e-80ab-8366ae689385	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-03-30	0	\N
3d6e301b-a121-4c9f-9251-337297453697	21361482-22ac-4724-bb76-04ae8540f974	2026-03-16	17.9	\N
d2168549-df44-4a93-98e6-f4d5bf1c3aab	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-01-26	18.4	\N
7bf9b2bd-1e58-49ff-a1b4-a009f7da1879	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-03-16	43.8	\N
9da98cb1-03f4-4612-817d-e48b6ad6bd84	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-02-23	10	\N
0cc0e50a-c9c6-4ec2-a356-9dcc9bf0b79a	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-02-23	37.5	\N
9b00eaf9-d230-4804-bcd5-0b3683adbcfa	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-02-16	19	\N
13391251-a503-48ff-b673-97a91ce61d34	1725dc41-e582-48b9-8468-886d9b95b54d	2026-02-16	9	\N
bebe8895-5362-4357-9d47-62fcba57ad86	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-04-13	13	\N
700ce0d6-992f-42ea-b39a-0c11a76c69ee	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-04-13	1.6	\N
b71cec74-8c12-4eda-be08-c2b72843e73f	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-02-16	25	\N
4d43b099-5dff-44e6-97c0-1781c62a0187	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-04-13	0	\N
f68bf975-4a4e-4ce6-9b00-aadb4b7e54e8	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-02-16	33.3	\N
66628b25-1965-4597-8fef-f62b8e203583	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-02-09	35	\N
04c020b0-2812-40ac-844c-c929b18846b1	1725dc41-e582-48b9-8468-886d9b95b54d	2026-02-09	13	\N
0d756219-0c1a-43e6-a013-4429a41be3b2	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-04-06	0	\N
98308c5c-b693-437d-aa6b-0f8a4c631dcf	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-02-09	0	\N
61d35e8e-529b-4d17-a1cf-b4df39ea7508	21361482-22ac-4724-bb76-04ae8540f974	2026-04-13	12.1	\N
279822c6-bb4d-4fe8-85d2-53f7c706bf4b	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-02-09	43	\N
eb4591b1-170c-47bf-8f8c-0e3f02324a2d	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-03-30	35	\N
696bee38-a077-499a-940a-403a0e752d5a	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-04-13	88.9	\N
3df3efd1-cde2-4d28-a07e-a04b784cecaa	1725dc41-e582-48b9-8468-886d9b95b54d	2026-03-30	16	\N
a8ecec5a-993f-4178-b09a-e8715129c071	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-03-23	0	\N
53cd5174-722e-4e31-be61-1c780cd93cfe	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-04-13	43178.59	\N
ffe6e6dc-3fc6-403d-af5d-485a79c035a4	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-03-23	0	\N
ce9eda07-6c12-4f51-8167-58b3a303f45d	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-04-20	16	\N
f2e5de94-1889-49b0-b14b-cd4bf5d4cb61	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-03-16	48795.24	\N
e5e54b6d-72b6-4dc4-b633-68f34ba756c3	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-03-16	0	\N
fd679ca0-1372-4984-8272-c3abd1db12e2	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-03-09	10	\N
76395913-dadb-4717-ba10-ad164232bbed	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-03-30	32	\N
b3d6ff77-0db8-4097-9aab-bf1a04a6cf30	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-03-09	23460.84	\N
3b07243b-4661-414a-902b-c854122d9a33	1725dc41-e582-48b9-8468-886d9b95b54d	2026-04-20	7	\N
64ec3695-a7d9-4216-823b-34f0309948e8	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-04-20	21	\N
8b3d5f87-56a3-423f-be90-9b093b5a8105	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-03-02	97893.75000000001	\N
441c7b6b-b308-430a-81d3-67975d5d8b0b	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-02-23	49453.399999999994	\N
4c386508-e43d-43f7-8f19-76c3f92a2905	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-03-09	0	\N
01500f13-eca5-45cc-8ad1-1c626b770dfd	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-04-20	1.4	\N
d051276a-4834-41a1-9e0b-87d5ab17b101	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-03-30	0.2	\N
0abc3330-1b57-4c97-8ce5-6b2fed36df23	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-02-16	112388.59000000001	\N
de681aed-bcc6-4784-b2d3-d57898918837	21361482-22ac-4724-bb76-04ae8540f974	2026-03-30	12.7	\N
f3722689-81c5-40ae-aa02-1e92dd660b77	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-02-09	86297.1	\N
cb464634-7160-4630-8860-66a86c4a1cd1	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-03-02	0	\N
03ec3d6e-fc16-46b2-b391-1fc54e3fad06	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-02-02	28496.219999999998	\N
d0cd1b41-63a7-4874-b99c-c4c0a02604f4	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-03-30	57.1	\N
e8eaab58-7b95-4899-8ffd-e91863e81853	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-03-30	78419.4	\N
a967edf1-29e5-4df8-b2a4-121040f80714	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-03-23	21	\N
7d119fc1-8cd3-4f86-9c03-a3561fd6d5fb	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-01-26	143275.36	\N
833f9986-1743-4906-af35-1895e40e4430	1725dc41-e582-48b9-8468-886d9b95b54d	2026-03-23	9	\N
e6e4b1e3-bca8-4fc0-96cf-06afb24369fb	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-02-02	0	\N
8c64cc22-b163-4bcf-92ba-b40d1d8b547d	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-01-19	100	\N
bcdb0ddf-a0c7-404e-95c0-e50cf245661a	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-02-23	0	\N
c7cac4c1-a590-4e97-9769-570c3ce1fc36	21361482-22ac-4724-bb76-04ae8540f974	2026-03-23	12.5	\N
57293255-aac0-4f82-9f67-b5d6c29f1295	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-03-23	33.3	\N
146e582d-0cfa-43c3-8e96-236942c3893e	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-03-23	51644.009999999995	\N
2c61d119-dcc8-4814-873e-a0f224036b2b	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-02-16	0	\N
51aa783a-e37e-45b2-9e87-f6f05adc8175	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-03-16	16	\N
eff5a394-a005-47aa-9dbd-832940342727	1725dc41-e582-48b9-8468-886d9b95b54d	2026-03-16	3	\N
81f51d8f-5f11-407b-8556-1b3b0fcf43b8	1725dc41-e582-48b9-8468-886d9b95b54d	2026-03-09	6	\N
be502178-8464-40f2-8924-19c251ee8a2a	21361482-22ac-4724-bb76-04ae8540f974	2026-04-20	15.7	\N
e837f0b0-3acd-411b-9784-a8e910b0d083	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-01-26	0	\N
ac93869c-68b6-4a3a-90d2-13404e8157bc	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-04-20	43.8	\N
b85752fe-827d-47ff-bcc6-260d0176ab97	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-04-20	57601.95	\N
145fcf5c-01e9-4338-b740-fdecaf88828c	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-04-13	18	\N
0f74760d-ff3f-431f-9b65-0266ac04b047	1725dc41-e582-48b9-8468-886d9b95b54d	2026-04-13	6	\N
f562129d-563f-4318-bc42-2ff3437230b4	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-03-09	17	\N
913b5cce-9698-4935-8357-962dd135dc05	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-03-09	60	\N
e7892ba1-3fc1-45d6-a546-88961c4d6d43	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-03-02	37	\N
79aaba9c-7cb9-446e-b274-0336e1357914	1725dc41-e582-48b9-8468-886d9b95b54d	2026-03-02	13	\N
f741bd16-a99a-4e9b-8f1e-0f6e086394f5	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-03-02	40	\N
4f388ef9-b58d-4aa5-8e3a-f6efc10a1545	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-03-02	0.2	\N
35fed512-dba1-4995-9ddc-c17e423d3015	21361482-22ac-4724-bb76-04ae8540f974	2026-03-02	12.5	\N
0489d4b7-c94c-4b97-9b79-b135e93fbf11	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-03-02	90.9	\N
2ddbce1a-b8c5-4dad-96e6-7898f81e2a5e	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-02-23	8	\N
4c78e350-7d82-492d-8409-25c4c78ddac6	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-02-09	0	\N
996fd971-c79e-4cc5-ac03-ab1d5ae9bec0	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-02-02	23	\N
c937e935-4cc4-4fe0-a25f-637b8eaa0f8e	1725dc41-e582-48b9-8468-886d9b95b54d	2026-02-02	7	\N
d3210a91-c09d-4aa6-8ca2-2caf3ad5af79	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-04-06	26	\N
4e2f5359-f63e-40dd-89c2-92f5ab4efb6a	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-04-20	0	\N
b2017e33-0140-48cc-baaa-92b41035eacd	ed9d7b96-4119-459a-a70a-bd9920cc0c9f	2026-01-19	0	\N
6f0b4a75-99cf-414b-9cd9-8691d8776777	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-01-19	0	\N
60afe32b-600c-45ca-a416-05d814503fc0	1725dc41-e582-48b9-8468-886d9b95b54d	2026-04-06	12	\N
4ba0d9bc-7467-423b-a96c-1651c85e82bf	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-04-06	25	\N
d49c5a27-0567-4c44-8a0f-4f020583a2e9	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-04-06	0	\N
64c41ddd-afb6-4294-86f7-20d4e6ef4a42	1725dc41-e582-48b9-8468-886d9b95b54d	2026-02-23	6	\N
bff7e6f0-4f13-4a62-9825-76c67c7e7d96	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-02-02	18	\N
2ab259ad-e090-464d-ba46-ecbc54e8912f	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-02-02	47.8	\N
f00303e9-4cd6-4028-b6d7-0c9a5342fcd9	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-01-26	38	\N
552df7ff-7f2b-427b-9674-86776db2e633	21361482-22ac-4724-bb76-04ae8540f974	2026-04-06	8	\N
e2086a67-14ac-422d-bf4c-8840c687f9a0	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-04-06	42.3	\N
29bbebfc-e889-46dd-8d53-4316456485b5	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-04-06	35821.61	\N
7afbf64b-357a-4049-bfcd-70e3e88f3702	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-03-09	0	\N
d650ae67-0c21-4cc0-9bc2-d5b617779f6d	21361482-22ac-4724-bb76-04ae8540f974	2026-03-09	10.7	\N
5ee573e4-ee30-4e77-8503-af8c963a1935	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-02-23	1.9	\N
3431cc5b-7efb-45f1-b0a2-558699f58802	21361482-22ac-4724-bb76-04ae8540f974	2026-02-23	18.8	\N
303fd7c8-d5f0-4efc-ab19-86c35f4e84d4	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-02-16	8.6	\N
a791d9ed-a64f-4367-9653-19b559fe1bb0	21361482-22ac-4724-bb76-04ae8540f974	2026-02-16	15.9	\N
f80d6176-490f-432a-a736-52262dd93f06	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-02-09	3	\N
5a461231-ce0f-4885-932c-14362c6d8847	21361482-22ac-4724-bb76-04ae8540f974	2026-02-09	21.5	\N
130aac48-fdcf-4045-84ff-f4b65ef3acad	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-02-02	5.9	\N
e45e4bbc-35d0-4a26-a27c-857ca4a40794	21361482-22ac-4724-bb76-04ae8540f974	2026-02-02	19.2	\N
96141fcc-2524-4314-9179-7c6fb7b85734	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-01-26	2.8	\N
2fd1a5d9-a0ff-4a88-b833-4da23918d306	21361482-22ac-4724-bb76-04ae8540f974	2026-01-26	20.9	\N
e58468db-944b-4f14-8819-59d31787b079	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-04-27	33	\N
509dc951-488a-45e9-8858-df9561597d48	1725dc41-e582-48b9-8468-886d9b95b54d	2026-04-27	10	\N
1a2cbdcb-a823-476b-80ba-f6e1b57e6728	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-04-27	35	\N
72bda1cc-1021-49b2-b4a0-50766d9e47ae	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-04-27	0	\N
acfd1a41-7bbd-40a4-a093-5c5c50e5e995	21361482-22ac-4724-bb76-04ae8540f974	2026-04-27	20.3	\N
f54bd9b7-0488-4fe6-be4b-10b75b43783c	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-04-27	18.2	\N
5615c008-ab0d-4bca-b1c4-ae162c1e9e38	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-04-27	99633.61	\N
1e61b2bb-8fb5-471e-bb4c-0b4846a6d908	f60081e4-529d-4cc9-bdbb-5ebf14201564	2026-05-04	17	\N
126da1c4-6057-458b-9d78-c7ca395480c1	1725dc41-e582-48b9-8468-886d9b95b54d	2026-05-04	5	\N
632f2e88-548c-4d29-9a09-6e4a98e30dc3	10b9785e-c71d-48ea-a630-0ceaa1319de3	2026-05-04	9	\N
91d640ea-dce0-4243-9d2d-c76548082850	583afd0d-b8fd-4776-9144-1e5b37fc8c56	2026-05-04	0	\N
df5b78e8-8a7b-4c04-bcaf-13467e2a84ca	21361482-22ac-4724-bb76-04ae8540f974	2026-05-04	17.8	\N
8d096fa8-a5f6-4b26-90fc-dc896abe91a4	0066498e-e5ab-4676-ad6f-b83652fc6333	2026-05-04	5.9	\N
2fea04d5-494c-41ba-aeef-e6bee33ca3ab	a9e91e95-b00b-403a-a385-9f6ee45af5c0	2026-05-04	8636.720000000001	\N
\.


--
-- Data for Name: scorecard_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scorecard_metrics (id, team_id, name, owner_id, goal, comparator, goal_min, goal_max, unit, order_idx, active) FROM stdin;
0066498e-e5ab-4676-ad6f-b83652fc6333	\N	On-Time Delivery %	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	90	gte	\N	\N	%	0	t
a9e91e95-b00b-403a-a385-9f6ee45af5c0	\N	Weekly Revenue	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	50000	gte	\N	\N	$	0	t
f60081e4-529d-4cc9-bdbb-5ebf14201564	\N	Runs Completed	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	20	gte	\N	\N	runs	0	t
1725dc41-e582-48b9-8468-886d9b95b54d	\N	Jobs Completed	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	10	gte	\N	\N	jobs	0	t
21361482-22ac-4724-bb76-04ae8540f974	\N	Avg Days Order→Complete	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	14	lte	\N	\N	days	0	t
ed9d7b96-4119-459a-a70a-bd9920cc0c9f	\N	Parent Jobs Invoiced	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	10	gte	\N	\N	jobs	0	f
10b9785e-c71d-48ea-a630-0ceaa1319de3	\N	Runs Invoiced	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	20	gte	\N	\N	runs	0	t
583afd0d-b8fd-4776-9144-1e5b37fc8c56	\N	Avg Days Shipped→Invoiced	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	5	lte	\N	\N	days	0	t
\.


--
-- Data for Name: seats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.seats (id, team_id, title, roles, parent_seat_id, person_id, gwc_gets_it, gwc_wants_it, gwc_capacity, order_idx, created_at, updated_at) FROM stdin;
942b1771-e0d0-44ed-9693-24141ea2f4bb	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	CEO	["Visionary", "Strategic Leadership", "Company Direction"]	\N	a9f461f0-251a-41c9-957c-86e948e90b88	\N	\N	\N	0	2026-04-16 21:42:37.76277	2026-04-16 21:42:37.76277
f2edad1f-85d2-4b94-8d96-92a8f42de550	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Operations and Account Coordinator	[]	942b1771-e0d0-44ed-9693-24141ea2f4bb	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	\N	\N	\N	0	2026-04-16 21:42:37.92471	2026-04-16 21:42:37.92471
222db3a7-90fc-4b36-81d7-95ed32ef204f	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Industrial Maintenance Mechanic/Production Lead	[]	942b1771-e0d0-44ed-9693-24141ea2f4bb	712c1f13-ccc6-4a88-b3ad-606736416108	\N	\N	\N	1	2026-04-16 21:42:38.082971	2026-04-16 21:42:38.082971
ded34509-3fc8-423e-b8a5-9e8365ec9548	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Office Admin	[]	942b1771-e0d0-44ed-9693-24141ea2f4bb	c3978bd3-49bd-4f8d-bda1-e428d36d6c20	\N	\N	\N	2	2026-04-16 21:42:38.240616	2026-04-16 21:42:38.240616
1b386d92-4fb3-4377-af06-b08a74598dbc	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Operations and Account Coordinator	[]	942b1771-e0d0-44ed-9693-24141ea2f4bb	2e61c68f-1867-4706-96d4-d60762dc3b99	\N	\N	\N	3	2026-04-16 21:42:38.40827	2026-04-16 21:42:38.40827
c22e8773-77bd-44b3-a355-ab5296aeca5c	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Production Associate	[]	1b386d92-4fb3-4377-af06-b08a74598dbc	e23322e4-513f-4bfd-8799-543bb2ca891d	\N	\N	\N	0	2026-04-16 21:42:38.568329	2026-04-16 21:42:38.568329
28839b78-26c2-46a0-b60d-114164e69c51	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Production Associate	[]	1b386d92-4fb3-4377-af06-b08a74598dbc	f7a27109-7dfb-4b9e-9c7a-c8b6054d00db	\N	\N	\N	1	2026-04-16 21:42:38.726023	2026-04-16 21:42:38.726023
3e6876ca-5316-4cc8-8768-cd0dd6561294	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Die Cut Operator	[]	1b386d92-4fb3-4377-af06-b08a74598dbc	17f0b933-f98a-4b9c-940d-e19c2b96d40f	\N	\N	\N	2	2026-04-16 21:42:38.885075	2026-04-16 21:42:38.885075
4e79872a-e91f-4937-be81-3b270162f62b	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Material Handler/Production Associate	[]	1b386d92-4fb3-4377-af06-b08a74598dbc	d2b327cc-d6ac-4aeb-83f3-0ecf0c287bf4	\N	\N	\N	3	2026-04-16 21:42:39.042016	2026-04-16 21:42:39.042016
48d14da3-30d7-4433-9a05-f4e044206670	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Production Associate	[]	1b386d92-4fb3-4377-af06-b08a74598dbc	b52b2697-a3b5-4c51-b465-10cd7faf7cfa	\N	\N	\N	4	2026-04-16 21:42:39.207026	2026-04-16 21:42:39.207026
8b1437c3-5f5d-49e9-85a5-5bde068b081f	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Production Assistant	[]	1b386d92-4fb3-4377-af06-b08a74598dbc	d0c300d3-192a-4d17-a798-c45f09a33aef	\N	\N	\N	5	2026-04-16 21:42:39.366514	2026-04-16 21:42:39.366514
4203e71d-f634-43aa-a490-7c58597883c7	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Production Assistant	[]	1b386d92-4fb3-4377-af06-b08a74598dbc	6d0f4a84-3fc3-4e27-b69d-91738123d938	\N	\N	\N	6	2026-04-16 21:42:39.524237	2026-04-16 21:42:39.524237
3920e37f-6dfe-482c-aa8c-e7f5d6ae5468	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Production Associate	[]	1b386d92-4fb3-4377-af06-b08a74598dbc	f9a5ddf3-a397-46a2-832c-a39bc21d2a87	\N	\N	\N	7	2026-04-16 21:42:39.686189	2026-04-16 21:42:39.686189
21a11372-d9d4-4166-9bf8-fd28c83d2d0a	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Production Associate	[]	1b386d92-4fb3-4377-af06-b08a74598dbc	0ac93457-e281-40bd-baa7-bed74952e456	\N	\N	\N	8	2026-04-16 21:42:39.843364	2026-04-16 21:42:39.843364
e960a1c7-dfa8-4d3f-974e-d27436d851e2	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Team Member	[]	942b1771-e0d0-44ed-9693-24141ea2f4bb	2197849b-4ecc-48bf-85a5-01345057e8cf	\N	\N	\N	4	2026-04-29 15:20:14.694902	2026-04-29 15:20:14.694902
e00edb9b-47b3-4587-ad18-b0ad3c81f6e2	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Team Member	[]	942b1771-e0d0-44ed-9693-24141ea2f4bb	039daca9-c018-47b5-88bb-3dfaf39db093	\N	\N	\N	5	2026-04-29 15:20:15.347308	2026-04-29 15:20:15.347308
\.


--
-- Data for Name: shift_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shift_assignments (id, shift_session_id, station_id, user_id) FROM stdin;
06830382-f6d4-4a33-8cbb-d046a96bce05	ec08a7e4-fa8d-4fd3-a54d-39f932bc10e3	8a05fad7-3641-445e-9321-b81af1a1f9eb	f7a27109-7dfb-4b9e-9c7a-c8b6054d00db
810a55ee-eb71-4a4a-b693-e0af933bd9b5	6020b239-6db5-4dc1-a7a2-ebe0b47fd102	02656398-5e95-46c0-855b-a51a313ad4ce	b2002810-57bd-4e68-8d0c-5db0b9adb1b4
\.


--
-- Data for Name: shift_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shift_events (id, shift_session_id, station_id, kind, payload, occurred_at, recorded_by, related_knack_job_id) FROM stdin;
c2e59afe-66c7-4778-a148-7357d9c93055	ec08a7e4-fa8d-4fd3-a54d-39f932bc10e3	8a05fad7-3641-445e-9321-b81af1a1f9eb	operator_moved	{"userId": "f7a27109-7dfb-4b9e-9c7a-c8b6054d00db", "userName": "Cung Thang", "toStationId": "8a05fad7-3641-445e-9321-b81af1a1f9eb", "fromStationId": null, "toStationName": "Durst", "fromStationName": null}	2026-05-08 19:30:37.46	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	\N
78b5ac3e-a847-41b2-8f4a-fbb48c81bf19	ec08a7e4-fa8d-4fd3-a54d-39f932bc10e3	02656398-5e95-46c0-855b-a51a313ad4ce	job_started	{"customer": "Acme Corp", "jobNumber": "J-5432", "knackJobId": "mock-02656398-5e95-46c0-855b-a51a313ad4ce-current"}	2026-05-08 19:32:15.366	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	mock-02656398-5e95-46c0-855b-a51a313ad4ce-current
2e6bfbc5-42ce-4965-92e0-c2463378b138	ec08a7e4-fa8d-4fd3-a54d-39f932bc10e3	\N	operator_moved	{"userId": "b2002810-57bd-4e68-8d0c-5db0b9adb1b4", "userName": "Hunter Edwards", "toStationId": "1e644c62-8f97-431b-b7e0-62ff6f02e799", "fromStationId": null, "toStationName": "SDC", "fromStationName": null}	2026-05-08 19:30:32.398	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	\N
ad229e40-ff3a-4379-b48f-10f4ea9a6acc	ec08a7e4-fa8d-4fd3-a54d-39f932bc10e3	\N	operator_moved	{"userId": "b2002810-57bd-4e68-8d0c-5db0b9adb1b4", "userName": "Hunter Edwards", "toStationId": "1e644c62-8f97-431b-b7e0-62ff6f02e799", "fromStationId": null, "toStationName": "SDC", "fromStationName": null}	2026-05-08 19:30:34.33	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	\N
ca21f36f-290a-4061-8054-9541b883e37a	6020b239-6db5-4dc1-a7a2-ebe0b47fd102	02656398-5e95-46c0-855b-a51a313ad4ce	operator_moved	{"userId": "b2002810-57bd-4e68-8d0c-5db0b9adb1b4", "userName": "Hunter Edwards", "toStationId": "02656398-5e95-46c0-855b-a51a313ad4ce", "fromStationId": null, "toStationName": "Die Cut", "fromStationName": null}	2026-05-12 18:40:39.333	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	\N
ba081ef6-fcb1-48d9-85d1-978c13c436f5	6020b239-6db5-4dc1-a7a2-ebe0b47fd102	02656398-5e95-46c0-855b-a51a313ad4ce	operator_moved	{"userId": "b2002810-57bd-4e68-8d0c-5db0b9adb1b4", "userName": "Hunter Edwards", "toStationId": "02656398-5e95-46c0-855b-a51a313ad4ce", "fromStationId": null, "toStationName": "Die Cut", "fromStationName": null}	2026-05-12 18:40:46.084	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	\N
\.


--
-- Data for Name: shift_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shift_sessions (id, team_id, date, shift_number, opened_by, opened_at, closed_at, handoff_notes) FROM stdin;
ec08a7e4-fa8d-4fd3-a54d-39f932bc10e3	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	2026-05-08	1	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-05-08 19:30:07.766135	\N	\N
f26ef593-bf1c-42b6-a2f1-76a23e2bcba4	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	2026-05-11	2	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-05-11 20:39:34.250808	\N	\N
6020b239-6db5-4dc1-a7a2-ebe0b47fd102	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	2026-05-12	1	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-05-12 18:21:04.250833	\N	\N
7f2eff1d-e139-4626-86da-a052c7456eae	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	2026-05-12	2	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-05-13 00:57:32.745683	\N	\N
30b91fb2-fcb9-4274-b8bb-fe1d63bb7b00	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	2026-05-13	1	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-05-13 13:36:50.577608	\N	\N
7802a08b-da92-4cfc-8c43-db77f937f6a2	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	2026-05-14	1	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-05-14 18:06:43.795692	\N	\N
\.


--
-- Data for Name: station_default_operators; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.station_default_operators (id, station_id, user_id, priority) FROM stdin;
\.


--
-- Data for Name: stations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stations (id, team_id, name, kind, display_order, group_label, knack_machine_center_id, archived_at, created_at) FROM stdin;
c94abb3f-6252-4a2f-b60c-283085e94ad7	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	CAD	cad	4	Cutting	cad	\N	2026-05-12 18:33:35.152849
8a05fad7-3641-445e-9321-b81af1a1f9eb	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Durst	printer	1	printing	press_2	\N	2026-05-08 19:28:09.550283
677ce604-a95e-4d4f-b3ec-71972f502553	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Barberan	printer	2	printing	press_1	\N	2026-05-08 19:28:20.071745
ed1726a9-dff8-4203-96a4-93f7834b02e8	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Lamina	gluer	3	finishing	gluer_tape	\N	2026-05-08 19:28:48.554752
02656398-5e95-46c0-855b-a51a313ad4ce	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Die Cut	rotary	6	Die Cut	rotary	\N	2026-05-08 19:29:28.229016
11871631-dbba-4f63-801f-96199fbd0471	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Packout	handwork	7	handwork	handwork	\N	2026-05-08 19:29:46.059996
\.


--
-- Data for Name: task_pool; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_pool (id, team_id, title, est_minutes, suggested_station_id, status, source, source_todo_id, assigned_shift_session_id, assigned_user_id, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: team_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_settings (team_id, teams_webhook_url) FROM stdin;
88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	https://default62febfaf648d46b8be161c90f59987.71.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0def91a014924e7580aba4613ca24cb3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BIy5ryjhmMGsX5SxbWYqDDvGUHspBMwJdBPSnI0hn14
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, name, created_at) FROM stdin;
88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	Colorhub	2026-04-15 21:16:36.783709
\.


--
-- Data for Name: todos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.todos (id, team_id, title, owner_id, due_date, status, source_meeting_id, created_at, completed_at) FROM stdin;
68e67edf-a981-4880-aa8e-031c5efa999f	\N	send email to H3D	b2002810-57bd-4e68-8d0c-5db0b9adb1b4	2026-04-23	done	\N	2026-04-16 03:03:32.402316	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, team_id, email, name, avatar_url, created_at, profile_color, role) FROM stdin;
e23322e4-513f-4bfd-8799-543bb2ca891d	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	biak@colorhub.io	Biak Hmun Sang	\N	2026-04-16 21:42:30.007604	\N	member
f7a27109-7dfb-4b9e-9c7a-c8b6054d00db	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	cung@colorhub.io	Cung Thang	\N	2026-04-16 21:42:30.504671	\N	member
712c1f13-ccc6-4a88-b3ad-606736416108	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	javier@colorhub.io	Javier Alvarez Lopez	\N	2026-04-16 21:42:31.324648	\N	member
c3978bd3-49bd-4f8d-bda1-e428d36d6c20	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	jill@colorhub.io	Jill Harris	\N	2026-04-16 21:42:31.826429	\N	member
17f0b933-f98a-4b9c-940d-e19c2b96d40f	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	jonathan@colorhub.io	Jonathan Sang	\N	2026-04-16 21:42:32.324217	\N	member
d2b327cc-d6ac-4aeb-83f3-0ecf0c287bf4	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	kyle@colorhub.io	Kyle Raduski	\N	2026-04-16 21:42:32.837046	\N	member
b52b2697-a3b5-4c51-b465-10cd7faf7cfa	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	leigh@colorhub.io	Leigh Tamminga	\N	2026-04-16 21:42:33.350826	\N	member
d0c300d3-192a-4d17-a798-c45f09a33aef	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	no.thang@colorhub.io	No Thang	\N	2026-04-16 21:42:33.845817	\N	member
a9f461f0-251a-41c9-957c-86e948e90b88	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	tim@colorhub.io	Tim Harris	\N	2026-04-16 21:42:34.342915	\N	member
2e61c68f-1867-4706-96d4-d60762dc3b99	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	tyler@colorhub.io	Tyler Valentine	\N	2026-04-16 21:42:34.837524	\N	member
6d0f4a84-3fc3-4e27-b69d-91738123d938	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	victor@colorhub.io	Victor Fam-bawl	\N	2026-04-16 21:42:35.330948	\N	member
f9a5ddf3-a397-46a2-832c-a39bc21d2a87	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	yoel@colorhub.io	Yoel Alvarez Pozo	\N	2026-04-16 21:42:35.821741	\N	member
0ac93457-e281-40bd-baa7-bed74952e456	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	ysaias@colorhub.io	Ysaias Yerbes	\N	2026-04-16 21:42:36.323195	\N	member
b2002810-57bd-4e68-8d0c-5db0b9adb1b4	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	h.edwards.327@gmail.com	Hunter Edwards	\N	2026-04-15 21:48:01.802332	#06b6d4	admin
2197849b-4ecc-48bf-85a5-01345057e8cf	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	erin@colorhub.io	Erin Hollandsworth	\N	2026-04-29 15:20:14.384959	\N	member
039daca9-c018-47b5-88bb-3dfaf39db093	88e07e01-6672-4a57-9be8-fd1fdf8d8c7b	sean@colorhub.io	Sean Arney	\N	2026-04-29 15:20:15.192863	\N	member
\.


--
-- Data for Name: vto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vto (id, team_id, core_focus_purpose, core_focus_niche, ten_year_target, marketing_strategy_target_market, marketing_strategy_uniques, marketing_strategy_proven_process, marketing_strategy_guarantee, three_year_picture_date, three_year_picture_revenue, three_year_picture_profit, three_year_picture_measurables, one_year_plan_date, one_year_plan_revenue, one_year_plan_profit, one_year_plan_goals, updated_at) FROM stdin;
\.


--
-- Name: core_values core_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_values
    ADD CONSTRAINT core_values_pkey PRIMARY KEY (id);


--
-- Name: headlines headlines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.headlines
    ADD CONSTRAINT headlines_pkey PRIMARY KEY (id);


--
-- Name: issues issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_pkey PRIMARY KEY (id);


--
-- Name: knack_routings_snapshot knack_routings_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knack_routings_snapshot
    ADD CONSTRAINT knack_routings_snapshot_pkey PRIMARY KEY (knack_record_id);


--
-- Name: knack_sync_log knack_sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knack_sync_log
    ADD CONSTRAINT knack_sync_log_pkey PRIMARY KEY (id);


--
-- Name: knack_sync_runs knack_sync_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knack_sync_runs
    ADD CONSTRAINT knack_sync_runs_pkey PRIMARY KEY (id);


--
-- Name: meeting_ratings meeting_ratings_meeting_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_ratings
    ADD CONSTRAINT meeting_ratings_meeting_user_unique UNIQUE (meeting_id, user_id);


--
-- Name: meeting_ratings meeting_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_ratings
    ADD CONSTRAINT meeting_ratings_pkey PRIMARY KEY (id);


--
-- Name: meeting_rsvps meeting_rsvps_meeting_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_rsvps
    ADD CONSTRAINT meeting_rsvps_meeting_user_unique UNIQUE (meeting_id, user_id);


--
-- Name: meeting_rsvps meeting_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_rsvps
    ADD CONSTRAINT meeting_rsvps_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: people_ratings people_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.people_ratings
    ADD CONSTRAINT people_ratings_pkey PRIMARY KEY (id);


--
-- Name: people_ratings people_ratings_subject_value_quarter_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.people_ratings
    ADD CONSTRAINT people_ratings_subject_value_quarter_unique UNIQUE (subject_id, core_value_id, gwc_field, quarter);


--
-- Name: pm_schedules pm_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_schedules
    ADD CONSTRAINT pm_schedules_pkey PRIMARY KEY (id);


--
-- Name: processes processes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processes
    ADD CONSTRAINT processes_pkey PRIMARY KEY (id);


--
-- Name: rock_activity rock_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rock_activity
    ADD CONSTRAINT rock_activity_pkey PRIMARY KEY (id);


--
-- Name: rock_subtasks rock_subtasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rock_subtasks
    ADD CONSTRAINT rock_subtasks_pkey PRIMARY KEY (id);


--
-- Name: rocks rocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rocks
    ADD CONSTRAINT rocks_pkey PRIMARY KEY (id);


--
-- Name: scorecard_entries scorecard_entries_metric_week_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_entries
    ADD CONSTRAINT scorecard_entries_metric_week_unique UNIQUE (metric_id, week_start);


--
-- Name: scorecard_entries scorecard_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_entries
    ADD CONSTRAINT scorecard_entries_pkey PRIMARY KEY (id);


--
-- Name: scorecard_metrics scorecard_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_metrics
    ADD CONSTRAINT scorecard_metrics_pkey PRIMARY KEY (id);


--
-- Name: seats seats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT seats_pkey PRIMARY KEY (id);


--
-- Name: shift_assignments shift_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_pkey PRIMARY KEY (id);


--
-- Name: shift_assignments shift_assignments_shift_session_id_station_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_shift_session_id_station_id_user_id_unique UNIQUE (shift_session_id, station_id, user_id);


--
-- Name: shift_events shift_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_events
    ADD CONSTRAINT shift_events_pkey PRIMARY KEY (id);


--
-- Name: shift_sessions shift_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_sessions
    ADD CONSTRAINT shift_sessions_pkey PRIMARY KEY (id);


--
-- Name: shift_sessions shift_sessions_team_id_date_shift_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_sessions
    ADD CONSTRAINT shift_sessions_team_id_date_shift_number_unique UNIQUE (team_id, date, shift_number);


--
-- Name: station_default_operators station_default_operators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.station_default_operators
    ADD CONSTRAINT station_default_operators_pkey PRIMARY KEY (id);


--
-- Name: station_default_operators station_default_operators_station_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.station_default_operators
    ADD CONSTRAINT station_default_operators_station_id_user_id_unique UNIQUE (station_id, user_id);


--
-- Name: stations stations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stations
    ADD CONSTRAINT stations_pkey PRIMARY KEY (id);


--
-- Name: task_pool task_pool_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_pool
    ADD CONSTRAINT task_pool_pkey PRIMARY KEY (id);


--
-- Name: team_settings team_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_settings
    ADD CONSTRAINT team_settings_pkey PRIMARY KEY (team_id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: todos todos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vto vto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vto
    ADD CONSTRAINT vto_pkey PRIMARY KEY (id);


--
-- Name: vto vto_team_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vto
    ADD CONSTRAINT vto_team_id_unique UNIQUE (team_id);


--
-- Name: idx_core_values_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_core_values_team ON public.core_values USING btree (team_id);


--
-- Name: idx_people_ratings_subject_quarter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_people_ratings_subject_quarter ON public.people_ratings USING btree (subject_id, quarter);


--
-- Name: idx_processes_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processes_team ON public.processes USING btree (team_id);


--
-- Name: idx_rock_activity_rock_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rock_activity_rock_created ON public.rock_activity USING btree (rock_id, created_at);


--
-- Name: idx_rocks_quarter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rocks_quarter ON public.rocks USING btree (quarter);


--
-- Name: idx_routings_complete; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_routings_complete ON public.knack_routings_snapshot USING btree (complete);


--
-- Name: idx_routings_station_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_routings_station_priority ON public.knack_routings_snapshot USING btree (station_key, production_priority);


--
-- Name: idx_seats_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seats_team ON public.seats USING btree (team_id);


--
-- Name: idx_todos_status_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_todos_status_owner ON public.todos USING btree (status, owner_id);


--
-- Name: idx_vto_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vto_team ON public.vto USING btree (team_id);


--
-- Name: core_values core_values_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_values
    ADD CONSTRAINT core_values_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: headlines headlines_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.headlines
    ADD CONSTRAINT headlines_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: headlines headlines_meeting_id_meetings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.headlines
    ADD CONSTRAINT headlines_meeting_id_meetings_id_fk FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: issues issues_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: issues issues_source_metric_id_scorecard_metrics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_source_metric_id_scorecard_metrics_id_fk FOREIGN KEY (source_metric_id) REFERENCES public.scorecard_metrics(id) ON DELETE SET NULL;


--
-- Name: issues issues_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: meeting_ratings meeting_ratings_meeting_id_meetings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_ratings
    ADD CONSTRAINT meeting_ratings_meeting_id_meetings_id_fk FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_ratings meeting_ratings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_ratings
    ADD CONSTRAINT meeting_ratings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: meeting_rsvps meeting_rsvps_meeting_id_meetings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_rsvps
    ADD CONSTRAINT meeting_rsvps_meeting_id_meetings_id_fk FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_rsvps meeting_rsvps_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_rsvps
    ADD CONSTRAINT meeting_rsvps_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: meetings meetings_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: people_ratings people_ratings_core_value_id_core_values_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.people_ratings
    ADD CONSTRAINT people_ratings_core_value_id_core_values_id_fk FOREIGN KEY (core_value_id) REFERENCES public.core_values(id);


--
-- Name: people_ratings people_ratings_subject_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.people_ratings
    ADD CONSTRAINT people_ratings_subject_id_users_id_fk FOREIGN KEY (subject_id) REFERENCES public.users(id);


--
-- Name: people_ratings people_ratings_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.people_ratings
    ADD CONSTRAINT people_ratings_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: pm_schedules pm_schedules_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_schedules
    ADD CONSTRAINT pm_schedules_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE CASCADE;


--
-- Name: processes processes_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processes
    ADD CONSTRAINT processes_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: processes processes_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processes
    ADD CONSTRAINT processes_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: rock_activity rock_activity_actor_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rock_activity
    ADD CONSTRAINT rock_activity_actor_id_users_id_fk FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- Name: rock_activity rock_activity_rock_id_rocks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rock_activity
    ADD CONSTRAINT rock_activity_rock_id_rocks_id_fk FOREIGN KEY (rock_id) REFERENCES public.rocks(id) ON DELETE CASCADE;


--
-- Name: rock_subtasks rock_subtasks_rock_id_rocks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rock_subtasks
    ADD CONSTRAINT rock_subtasks_rock_id_rocks_id_fk FOREIGN KEY (rock_id) REFERENCES public.rocks(id) ON DELETE CASCADE;


--
-- Name: rocks rocks_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rocks
    ADD CONSTRAINT rocks_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: rocks rocks_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rocks
    ADD CONSTRAINT rocks_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: scorecard_entries scorecard_entries_metric_id_scorecard_metrics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_entries
    ADD CONSTRAINT scorecard_entries_metric_id_scorecard_metrics_id_fk FOREIGN KEY (metric_id) REFERENCES public.scorecard_metrics(id) ON DELETE CASCADE;


--
-- Name: scorecard_metrics scorecard_metrics_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_metrics
    ADD CONSTRAINT scorecard_metrics_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: scorecard_metrics scorecard_metrics_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_metrics
    ADD CONSTRAINT scorecard_metrics_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: seats seats_person_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT seats_person_id_users_id_fk FOREIGN KEY (person_id) REFERENCES public.users(id);


--
-- Name: seats seats_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT seats_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: shift_assignments shift_assignments_shift_session_id_shift_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_shift_session_id_shift_sessions_id_fk FOREIGN KEY (shift_session_id) REFERENCES public.shift_sessions(id) ON DELETE CASCADE;


--
-- Name: shift_assignments shift_assignments_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE CASCADE;


--
-- Name: shift_assignments shift_assignments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shift_events shift_events_recorded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_events
    ADD CONSTRAINT shift_events_recorded_by_users_id_fk FOREIGN KEY (recorded_by) REFERENCES public.users(id);


--
-- Name: shift_events shift_events_shift_session_id_shift_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_events
    ADD CONSTRAINT shift_events_shift_session_id_shift_sessions_id_fk FOREIGN KEY (shift_session_id) REFERENCES public.shift_sessions(id) ON DELETE CASCADE;


--
-- Name: shift_events shift_events_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_events
    ADD CONSTRAINT shift_events_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE SET NULL;


--
-- Name: shift_sessions shift_sessions_opened_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_sessions
    ADD CONSTRAINT shift_sessions_opened_by_users_id_fk FOREIGN KEY (opened_by) REFERENCES public.users(id);


--
-- Name: shift_sessions shift_sessions_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_sessions
    ADD CONSTRAINT shift_sessions_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: station_default_operators station_default_operators_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.station_default_operators
    ADD CONSTRAINT station_default_operators_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE CASCADE;


--
-- Name: station_default_operators station_default_operators_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.station_default_operators
    ADD CONSTRAINT station_default_operators_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: stations stations_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stations
    ADD CONSTRAINT stations_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: task_pool task_pool_assigned_shift_session_id_shift_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_pool
    ADD CONSTRAINT task_pool_assigned_shift_session_id_shift_sessions_id_fk FOREIGN KEY (assigned_shift_session_id) REFERENCES public.shift_sessions(id) ON DELETE SET NULL;


--
-- Name: task_pool task_pool_assigned_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_pool
    ADD CONSTRAINT task_pool_assigned_user_id_users_id_fk FOREIGN KEY (assigned_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: task_pool task_pool_source_todo_id_todos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_pool
    ADD CONSTRAINT task_pool_source_todo_id_todos_id_fk FOREIGN KEY (source_todo_id) REFERENCES public.todos(id) ON DELETE SET NULL;


--
-- Name: task_pool task_pool_suggested_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_pool
    ADD CONSTRAINT task_pool_suggested_station_id_stations_id_fk FOREIGN KEY (suggested_station_id) REFERENCES public.stations(id) ON DELETE SET NULL;


--
-- Name: task_pool task_pool_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_pool
    ADD CONSTRAINT task_pool_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: team_settings team_settings_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_settings
    ADD CONSTRAINT team_settings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: todos todos_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: todos todos_source_meeting_id_meetings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_source_meeting_id_meetings_id_fk FOREIGN KEY (source_meeting_id) REFERENCES public.meetings(id) ON DELETE SET NULL;


--
-- Name: todos todos_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: users users_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: vto vto_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vto
    ADD CONSTRAINT vto_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: core_values; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.core_values ENABLE ROW LEVEL SECURITY;

--
-- Name: headlines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.headlines ENABLE ROW LEVEL SECURITY;

--
-- Name: issues; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

--
-- Name: knack_routings_snapshot; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.knack_routings_snapshot ENABLE ROW LEVEL SECURITY;

--
-- Name: knack_sync_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.knack_sync_log ENABLE ROW LEVEL SECURITY;

--
-- Name: knack_sync_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.knack_sync_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: meeting_ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meeting_ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: meeting_rsvps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meeting_rsvps ENABLE ROW LEVEL SECURITY;

--
-- Name: meetings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

--
-- Name: people_ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.people_ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: processes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

--
-- Name: rock_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rock_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: rock_subtasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rock_subtasks ENABLE ROW LEVEL SECURITY;

--
-- Name: rocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rocks ENABLE ROW LEVEL SECURITY;

--
-- Name: scorecard_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scorecard_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: scorecard_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scorecard_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: seats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

--
-- Name: shift_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: shift_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shift_events ENABLE ROW LEVEL SECURITY;

--
-- Name: shift_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shift_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: station_default_operators; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.station_default_operators ENABLE ROW LEVEL SECURITY;

--
-- Name: stations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

--
-- Name: task_pool; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_pool ENABLE ROW LEVEL SECURITY;

--
-- Name: team_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

--
-- Name: todos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: vto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vto ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict WGLxRNJ1w2h9Pn5NtdyA5fuogdcgGXwjuBrHfC02SOv0NNY2Vw7O4ZXJSengigr

