import * as pulumi from "@pulumi/pulumi";
import * as network from "@pulumi/azure-nextgen/network/latest";
import * as compute from "@pulumi/azure-nextgen/compute/latest";
import * as iotcentral from "@pulumi/azure-nextgen/iotcentral/latest"
import { StandardAccount } from "./common"

import { sshKey, projectName, stackName, } from "./config";
import { tagAllResources, } from "./taggable";

const config = new pulumi.Config()
const location ="eastus2";

/**
 * Resources
 */

const baseTags = {
    'cost-center': projectName,
    'stack': stackName,
};

//tagAllResources({ "costcenter": projectName, "env":"dev","team":"engineering", "demo":"yes", "cloud_location": `${location}` });

//  Resource Creation starts from here
// Creating StandardAccount via component resources
const lz = new StandardAccount(`${projectName}`, {
    location: location,
    cidrBlock: "10.0.0.0/22",
    subnetCidrBlocks: ["10.0.0.0/23", "10.0.2.0/23"]
});

// Create a network security group resource
const network_security_group = new network.NetworkSecurityGroup(`${projectName}-networkSecurityGroup`, {
    location,
    resourceGroupName: lz.resourceGroup.name,
    networkSecurityGroupName: `${projectName}-nsg`,
});

// Creeate a security rule.  This is created in the network security group.
// OutBound Security Rule
const security_rule1 = new network.SecurityRule(`${projectName}-securityRule1`, {
    access: "Deny",
    destinationAddressPrefix: "11.0.0.0/8",
    destinationPortRange: "8080",
    direction: "Outbound",
    networkSecurityGroupName: network_security_group.name,
    protocol: "*",
    priority: 100,
    resourceGroupName: lz.resourceGroup.name,
    sourceAddressPrefix: "10.0.0.0/8",
    sourcePortRange: "*",
    securityRuleName: `${projectName}-security-rule1`,
}, { parent: network_security_group });

// SSH Port 22 security group rule
const security_rule2 = new network.SecurityRule(`${projectName}-securityRule2`, {
    access: "Allow",
    destinationAddressPrefix: "*",
    destinationPortRange: "22",
    direction: "InBound",
    networkSecurityGroupName: network_security_group.name,
    protocol: "*",
    priority: 100,
    resourceGroupName: lz.resourceGroup.name,
    sourceAddressPrefix: "*",
    sourcePortRange: "*",
    securityRuleName: `${projectName}-security-rule2`,
}, { parent: network_security_group });

// Get instance count
const instanceCount = config.getNumber("instanceCount") ?? 1;
// Retrieving password from config
const password = config.requireSecret("password");
const initScript = `#!/bin/bash\n
echo "Hello, World from Pulumi!" > index.html
nohup python -m SimpleHTTPServer 80 &`;

// Creating N number of instances ( where N = instanceCount)
for (let i = 0; i < instanceCount; i++) {

    // Creating public ip address
    const publicIp = new network.PublicIPAddress(`${projectName}-ip-${i}`, {
        publicIpAddressName: `${projectName}-ip-${i}`,
        resourceGroupName: lz.resourceGroup.name,
        location,
        publicIPAllocationMethod: "Dynamic",
    }, {parent: lz} );

    // Creating network interface
    const networkInterface = new network.NetworkInterface(`${projectName}-nic-${i}`, {
        networkInterfaceName: `${projectName}-nic-nsg-${i}`,
        resourceGroupName: lz.resourceGroup.name,
        location,
        ipConfigurations: [{
            name: `${projectName}-nic-ipcfg-${i}`,
            subnet: { id: lz.subnets[i].id },
            publicIPAddress: { id: publicIp.id },
            privateIPAllocationMethod: "Dynamic"
        }]
    }, { parent: publicIp });

    // Creating user name for virtual machines
    const userName = "pulumi-admin";
    // Creating virtual machines names
    const myvmName = `${projectName}-vm-${i}`;
    // Creating virtual machines
    const webServer = new compute.VirtualMachine(myvmName, {
        resourceGroupName: lz.resourceGroup.name,
        location,
        vmName: myvmName,
        networkProfile: {
            networkInterfaces: [{ id: networkInterface.id }],
        },
        hardwareProfile: {
            vmSize: "Standard_A0",
        },

        osProfile: {
            computerName: "hostname",
            adminUsername: userName,
            adminPassword: password,
            customData: Buffer.from(initScript).toString("base64"),
            linuxConfiguration: {
                disablePasswordAuthentication: true,
                ssh: {
                    publicKeys: [{
                        keyData: sshKey.publicKeyOpenssh,
                        path: `/home/${userName}/.ssh/authorized_keys`, // reference the userName variable 
                    }]
                },
            },
        },
        storageProfile: {
            osDisk: {
                createOption: "FromImage",
                name: myvmName,
            },
            imageReference: {
                publisher: "canonical",
                offer: "UbuntuServer",
                sku: "18.04-LTS",
                version: "latest",
            },
        },

    }, { parent: networkInterface });
}
 
// creating iot app
const iotCentralApp = new iotcentral.App(`${projectName}-iotapp`, {
    displayName: "My IoT Central App",
    location: lz.resourceGroup.location,
    resourceGroupName: lz.resourceGroup.name,
    //resourceName: `${projectName}-iotapp`,
    resourceName: "myiotappdevic",
    subdomain: "my-iot-central-subdomain",
    sku: {
        name: "ST1",
    },
}, { parent: lz.resourceGroup });

export const resource_group = lz.resourceGroup.name;
export const network_cidr_block = lz.network.addressSpace;
export const network_name = lz.network.name;
export const network_security_group_name = network_security_group.name;
export const network_security_outbound_rule1_name = security_rule1.name;
export const network_security_outbound_rule1_direction = security_rule1.direction;
export const network_security_outbound_rule1_port_range = security_rule1.destinationPortRange;
export const network_security_inbound_rule2_name = security_rule2.name;
export const network_security_inbound_rule2_direction = security_rule2.direction;
export const network_security_inbound_rule2_port_range = security_rule2.destinationPortRange;
export const azure_region = location;
export const total_number_of_virtual_machines = instanceCount;
export const iot_central_app_name = iotCentralApp.name;
export const iot_central_app_name_sku = iotCentralApp.sku;