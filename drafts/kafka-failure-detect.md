# 判断consumer是否能继续处理
## send heartbeat vs process record
### same thread
process record may block send heartbeat.

### different thread
send heartbeat thread is ok, process record thread is block.
