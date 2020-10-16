import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface ServiceDeploymentArgs {
    namespace?: pulumi.Input<string>;
    replicas?: pulumi.Input<number>;
    image: pulumi.Input<string>;
    port: k8s.types.input.core.v1.ServicePort;
}

export class ServiceDeployment extends pulumi.ComponentResource {
    deployment: k8s.apps.v1.Deployment;
    service: k8s.core.v1.Service;
    url: pulumi.Output<string>;
    constructor(name: string, args: ServiceDeploymentArgs, opts?: pulumi.ComponentResourceOptions) {
        super("my:kubernetes:ServiceDeployment", name, args, opts)

        const appLabels = { app: name };
        this.deployment = new k8s.apps.v1.Deployment("eks-shaht-demo-apps-dep", {
            metadata: { namespace: args.namespace },
            spec: {
                selector: { matchLabels: appLabels },
                replicas: args.replicas || 1,
                template: {
                    metadata: { labels: appLabels },
                    spec: {
                        containers: [{
                            name: "eks-shaht-demo-apps",
                            //image: "gcr.io/google-samples/kubernetes-bootcamp:v1",
                            //image: "jocatalin/kubernetes-bootcamp:v2",
                            image: args.image
                        }],
                    },
                },
            },
        }, { parent: this });

        this.service = new k8s.core.v1.Service("app-svc", {
            metadata: { namespace: args.namespace },
            spec: {
                selector: appLabels,
                ports: [args.port],
                type: "LoadBalancer",
            },
        }, { parent: this });

        const address = this.service.status.loadBalancer.ingress[0].hostname;
        const port = this.service.spec.ports[0].port;
        this.url = pulumi.interpolate`http://${address}:${port}`;

    }
}