"""An Azure RM Python Pulumi program"""
#import * as pulumi from "@pulumi/pulumi";
#import * as resource from "@pulumi/azure-nextgen/network/latest";


import pulumi
import pulumi_azure_nextgen.storage.latest as storage
import pulumi_azure_nextgen.resources.latest as resources
import pulumi_azure_nextgen.databricks.latest as databricks

from pulumi import export, ResourceOptions, Config, StackReference, get_stack, get_project

config = Config()
mysubid = config.get("mysubid")
stackName = get_stack()
projectName = get_project()
mylocation = "eastus2"
myname = "shaht"
myresourcegroupname = "shaht-databrick-rg"
myWorkspacename = "myWorkspace"
basetags = {"cost-center": projectName, "stack":stackName, "env":"dev","team":"engineering", "demo":"yes", "cloud_location": mylocation}
# Create an Azure Resource Group
resource_group = resources.ResourceGroup("shaht-databrick-resourcegroup",
    resource_group_name = myresourcegroupname,
    location = mylocation,
    tags=basetags,
    )

workspace = databricks.Workspace("shaht-databrick-workspace",
    location=mylocation,
    resource_group_name=resource_group.name,
    workspace_name=myWorkspacename,
    parameters={
        "prepareEncryption": {
            "value": True,
        },
    },
    #managed_resource_group_id=f"/subscriptions/{mysubid}/resourceGroups/myWorkspace",
    managed_resource_group_id=f"/subscriptions/{mysubid}/resourceGroups/{myWorkspacename}",
)

v_net_peering = databricks.VNetPeering("vNetPeering",
    allow_forwarded_traffic=False,
    allow_gateway_transit=False,
    allow_virtual_network_access=True,
    peering_name="vNetPeeringTest",
    remote_virtual_network={
        "id": f"/subscriptions/{mysubid}/resourceGroups/shaht-databrick-vnetpeer-rg/providers/Microsoft.Network/virtualNetworks/shahtdatabrickvnetpeerstuff",
    },
    resource_group_name=resource_group.name,
    use_remote_gateways=False,
    workspace_name=workspace.name)


pulumi.export("resource group name", resource_group.name)
pulumi.export("resource group location", resource_group.location)
pulumi.export("workspace name", workspace.name)
pulumi.export("workspace status", workspace.provisioning_state)
pulumi.export("workspace url", workspace.workspace_url)
pulumi.export("vnet peering provisioning_state", v_net_peering.provisioning_state)
pulumi.export("vnet peering peering_state", v_net_peering.peering_state)
pulumi.export("vnet peering name", v_net_peering.name)
pulumi.export("vnet peering remote_address_space", v_net_peering.remote_address_space)
pulumi.export("vnet peering urn", v_net_peering.urn)
