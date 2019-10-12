---
title: 'compress'
date: 2018-01-01
...

##






MaxMetaspaceSize is designed to limit the amount of committed memory and
not to limit the amount of reserved memory. At this moment, there are no
flag to limit the amount of reserved memory by the metaspaces. If that
feature is needed, it would have to be implemented.

I agree that we shouldn't have to reserve 1 GB of virtual address space
for the compressed class space when MaxMetaspaceSize is set to  a lower
value. It should be enough to allocate MaxMetaspaceSize of compressed
class space. Unfortunately, we don't know how much Metadata will be put
inside the compressed class space vs the other metaspace memory areas
(containing the non-class metadata). So, we would probably end up
allowing ~ 2 x MaxMetaspaceSize of memory to be reserved if the program
committed MaxMetaspaceSize of non-class metadata.

We could reserve a contiguous memory area if user has set a low
MaxMetaspaceSize, say below 1 GB, and use that area for both classes and
non-class metadata. With that in place the MaxMetaspaceSize flag would
limit both the reserved and committed memory. Unfortunately, this has a
draw-back that mmap will destroy the reservation of the memory area if a
sub-sequent "commit" request would fail. We would have to handle that
somehow.

-XX:CICompilerCount
