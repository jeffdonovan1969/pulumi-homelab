import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { ServiceDeployment } from "./servicedeployment";

const pulumiConfig = new pulumi.Config();

// Existing Pulumi stack reference in the format:
// <organization>/<project>/<stack> e.g. "/shaht/eks-infrastructure/dev"
const clusterStackRef = new pulumi.StackReference(pulumiConfig.require("clusterStackRef"))

// Get the kubeconfig from the cluster stack output
const kubeconfig = clusterStackRef.getOutput("kubeconfig").apply(JSON.stringify);

// create the k8s provider with the kubeconfig
const provider = new k8s.Provider("k8sProvider", { kubeconfig });

// declare a namespace
const ns = new k8s.core.v1.Namespace("apps-ns", {
    metadata: { name: "eks-shaht-demo-apps" },
}, { provider });

/* const appLabels = { app: "eks-shaht-demo-apps" };
const deployment = new k8s.apps.v1.Deployment("eks-shaht-demo-apps-dep", {
    metadata: { namespace: ns.metadata.name },
    spec: {
        selector: { matchLabels: appLabels },
        replicas: 3,
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [{
                    name: "eks-shaht-demo-apps",
                    //image: "gcr.io/google-samples/kubernetes-bootcamp:v1",
                    image: "jocatalin/kubernetes-bootcamp:v2",
                }],
            },
        },
    },
}, { provider }); */

/* const service = new k8s.core.v1.Service("app-svc", {
    metadata: { namespace: ns.metadata.name },
    spec: {
        selector: appLabels,
        ports: [{ port: 80, targetPort: 8080 }],
        type: "LoadBalancer",
    },
}, { provider }); */

/* const address = service.status.loadBalancer.ingress[0].hostname;
const port = service.spec.ports[0].port;
export const url = pulumi.interpolate`http://${address}:${port}`; */

const bootcamp = new ServiceDeployment("eks-shaht-demo-app", {
    image: "jocatalin/kubernetes-bootcamp:v2",
    port: { port:3000, targetPort: 8080 },
    namespace: ns.metadata.name,
}, { provider });

export const url = bootcamp.url;