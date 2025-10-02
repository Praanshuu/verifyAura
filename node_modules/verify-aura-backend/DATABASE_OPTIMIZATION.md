# Database Optimization Recommendations

## Indexes for Better Performance

To optimize the queries in this application, consider adding the following database indexes:

### Events Table
```sql
-- For event filtering and sorting
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_tag ON events(tag);
CREATE INDEX idx_events_created_at ON events(created_at);

-- Composite index for common query patterns
CREATE INDEX idx_events_date_created_at ON events(date, created_at);
```

### Participants Table
```sql
-- For participant filtering and joins
CREATE INDEX idx_participants_event_id ON participants(event_id);
CREATE INDEX idx_participants_revoked ON participants(revoked);
CREATE INDEX idx_participants_created_at ON participants(created_at);
CREATE INDEX idx_participants_certificate_id ON participants(certificate_id);

-- Composite indexes for common queries
CREATE INDEX idx_participants_event_revoked ON participants(event_id, revoked);
CREATE INDEX idx_participants_name_email ON participants(name, email);
```

### Activity Logs Table
```sql
-- For log filtering and sorting
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- Composite index for time-based queries
CREATE INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at);
```

## Query Optimization Tips

1. **Use LIMIT clauses** - Always limit the number of records returned
2. **Implement pagination** - Use cursor-based pagination for large datasets
3. **Avoid N+1 queries** - Use joins and subqueries instead of multiple database calls
4. **Use appropriate data types** - Ensure UUIDs are stored as UUID, not text
5. **Monitor query performance** - Use EXPLAIN ANALYZE to identify slow queries

## Performance Monitoring

Monitor these metrics:
- Query execution time
- Number of database connections
- Index usage statistics
- Slow query logs

## Connection Pooling

Consider implementing connection pooling for better database performance:
- Use PgBouncer for connection pooling
- Configure appropriate pool sizes
- Monitor connection usage
