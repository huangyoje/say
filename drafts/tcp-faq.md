# close while data in buffer(recv/send)
# close white

# read after close by self
# read after close by remote
data in TCP receive buffer


# write after close by self
# write after close by remote


The only way the receive buffer can get cleared is by reading all the data, or if the server receives a reset, i.e. an RST, which can be caused in various ways, or of course if the server closes the socket without reading all the data, in which case it issues an RST if there was pending read data.
