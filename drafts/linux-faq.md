# `lsof`
  `lsof -a -i -s TCP:SYN_RECV -p <process-id>`
  - -p  
     lists all the entries for a specific process ID
  - -i  
     lists only network files open
  - -s      
     lists the TCP or UDP state
