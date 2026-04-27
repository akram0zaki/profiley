-- 0001_extensions.sql
-- Enable extensions required by Profiley.

create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists citext;
create extension if not exists pg_cron;
create extension if not exists pg_net;
