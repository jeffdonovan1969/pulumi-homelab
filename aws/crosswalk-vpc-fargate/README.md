# Pulumi:  NGINX on AWS ECS Fargate using Python with a vpc built in Typescript

### What Is This?

This is Pulumi code for deploying your own [ECS Fargate cluster with tags](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) on top of [previously configured network in a different language](https://github.com/tusharshahrs/pulumi-homelab/aws/crosswalk-vpc-fargate/).

### Why would you do this?  
Code in whatever language you want, you can use things across go, python, typescript, and dotnet. Reuse whatever you can.

### How is the vpc built?

The [vpc](https://www.pulumi.com/docs/guides/crosswalk/aws/vpc/) is built using pulumi [crosswalk](https://www.pulumi.com/docs/guides/crosswalk/aws/) in `typescript`.

### How is the ecs cluster built
The ecs cluster is built in `python`.

### How do we connect infrastructure written in typescript with python?
We do this via [StackReference](https://www.pulumi.com/docs/intro/concepts/organizing-stacks-projects/#inter-stack-dependencies).
The vpc [outputs](https://www.pulumi.com/docs/reference/cli/pulumi_stack_output/) will be read as inputs in the ecs fargate.

### Which Backend are we using?

We are going to use [Pulumi Service backend](https://www.pulumi.com/docs/intro/concepts/state/#pulumi-service-backend) for saving states/checkpoints.

### How do I use it

1. Go inside `crosswalk-vpc-ts` directory for usage information.
2. Go inside `fargate-with-crosswalk-vpc-python` directory for usage information.

The ecs fargate example is identical to original one https://github.com/pulumi/examples/tree/master/aws-py-fargate