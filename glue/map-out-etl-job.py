import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.dynamicframe import DynamicFrame

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'map_out_database', 'citybus_route_table', 'citybus_stop_table', 'citybus_route_stop_table', 'kmb_route_table', 'kmb_stop_table', 'kmb_route_stop_table', 'gmb_route_table', 'gmb_stop_table', 'gmb_route_stop_table', 'citybus_route_s3_output_path', 'citybus_stop_s3_output_path', 'citybus_route_stop_s3_output_path', 'kmb_route_s3_output_path', 'kmb_stop_s3_output_path', 'kmb_route_stop_s3_output_path', 'gmb_route_s3_output_path', 'gmb_stop_s3_output_path', 'gmb_route_stop_s3_output_path', 's3_output_bucket', 'updated_at'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Script generated for node Citybus Route Source
CitybusRouteSource_node1720719425796 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['citybus_route_table'], transformation_ctx="CitybusRouteSource_node1720719425796")

# Script generated for node Citybus Route Output
CitybusRouteOutput_node1720720085301 = glueContext.write_dynamic_frame.from_options(frame=CitybusRouteSource_node1720719425796, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/' + args['updated_at'] + args['citybus_route_s3_output_path'], "partitionKeys": []}, transformation_ctx="CitybusRouteOutput_node1720720085301")

# Script generated for node Citybus Stop Source
CitybusStopSource_node1720721664195 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['citybus_stop_table'], transformation_ctx="CitybusStopSource_node1720721664195")

CityBusStopPartitioned_dataframe = CitybusStopSource_node1720721664195.toDF().repartition(1)
CitybusStopPartitioned_dynamicframe = DynamicFrame.fromDF(CityBusStopPartitioned_dataframe, glueContext, "CitybusStopPartitioned_dynamicframe")

# Script generated for node Citybus Stop Output
CitybusStopOutput_node1720722288742 = glueContext.write_dynamic_frame.from_options(frame=CitybusStopPartitioned_dynamicframe, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/' + args['updated_at'] + args['citybus_stop_s3_output_path'], "partitionKeys": []}, transformation_ctx="CitybusStopOutput_node1720722288742")

# Script generated for node Citybus Route Stop Source
CitybusRouteStopSource_node1720722340345 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['citybus_route_stop_table'], transformation_ctx="CitybusRouteStopSource_node1720722340345")

CityBusRouteStopPartitioned_dataframe = CitybusRouteStopSource_node1720722340345.toDF().repartition(1)
CitybusRouteStopPartitioned_dynamicframe = DynamicFrame.fromDF(CityBusRouteStopPartitioned_dataframe, glueContext, "CitybusRouteStopPartitioned_dynamicframe")

# Script generated for node Citybus Route Stop Output
CitybusRouteStopOutput_node1720722429935 = glueContext.write_dynamic_frame.from_options(frame=CitybusRouteStopPartitioned_dynamicframe, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/' + args['updated_at'] + args['citybus_route_stop_s3_output_path'], "partitionKeys": []}, transformation_ctx="CitybusRouteStopOutput_node1720722429935")


# Script generated for node KMB Route Source
KMBRouteSource_node1720722470940 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['kmb_route_table'], transformation_ctx="KMBRouteSource_node1720722470940")


# Script generated for node KMB Route Output
KMBRouteOutput_node1720722520866 = glueContext.write_dynamic_frame.from_options(frame=KMBRouteSource_node1720722470940, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/' + args['updated_at'] + args['kmb_route_s3_output_path'], "partitionKeys": []}, transformation_ctx="KMBRouteOutput_node1720722520866")

# Script generated for node KMB Stop Source
KMBStopSource_node1720722561227 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['kmb_stop_table'], transformation_ctx="KMBStopSource_node1720722561227")

# Script generated for node KMB Stop Output
KMBStopOutput_node1720722612250 = glueContext.write_dynamic_frame.from_options(frame=KMBStopSource_node1720722561227, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/' + args['updated_at'] + args['kmb_stop_s3_output_path'], "partitionKeys": []}, transformation_ctx="KMBStopOutput_node1720722612250")

# Script generated for node KMB Route Stop Source
KMBRouteStopSource_node1720722659589 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['kmb_route_stop_table'], transformation_ctx="KMBRouteStopSource_node1720722659589")

# Script generated for node KMB Route Stop Output
KMBRouteStopOutput_node1720722716888 = glueContext.write_dynamic_frame.from_options(frame=KMBRouteStopSource_node1720722659589, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/' + args['updated_at'] + args['kmb_route_stop_s3_output_path'], "partitionKeys": []}, transformation_ctx="KMBRouteStopOutput_node1720722716888")

# Script generated for node GMB Route Source
GMBRouteSource_node1721239946312 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['gmb_route_table'], transformation_ctx="GMBRouteSource_node1721239946312")

GMBRoutePartitioned_dataframe = GMBRouteSource_node1721239946312.toDF().repartition(1)
GMBRoutePartitioned_dynamicframe = DynamicFrame.fromDF(GMBRoutePartitioned_dataframe, glueContext, "GMBRoutePartitioned_dynamicframe")

# Script generated for node GMB Route Output
GMBRouteOutput_node1721240064830 = glueContext.write_dynamic_frame.from_options(frame=GMBRoutePartitioned_dynamicframe, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/' + args['updated_at'] + args['gmb_route_s3_output_path'], "partitionKeys": []}, transformation_ctx="GMBRouteOutput_node1721240064830")

# Script generated for node GMB Stop Source
GMBStopSource_node1721240179632 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['gmb_stop_table'], transformation_ctx="GMBStopSource_node1721240179632")

GMBStopPartitioned_dataframe = GMBStopSource_node1721240179632.toDF().repartition(1)
GMBStopPartitioned_dynamicframe = DynamicFrame.fromDF(GMBStopPartitioned_dataframe, glueContext, "GMBStopPartitioned_dynamicframe")

# Script generated for node GMB - Stop - Output
GMBStopOutput_node1721241501753 = glueContext.write_dynamic_frame.from_options(frame=GMBStopPartitioned_dynamicframe, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/' + args['updated_at'] + args['gmb_stop_s3_output_path'], "partitionKeys": []}, transformation_ctx="GMBStopOutput_node1721241501753")

# Script generated for node GMB - Route Stop - Source
GMBRouteStopSource_node1721240313342 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['gmb_route_stop_table'], transformation_ctx="GMBRouteStopSource_node1721240313342")

GMBRouteStopPartitioned_dataframe = GMBRouteStopSource_node1721240313342.toDF().repartition(1)
GMBRouteStopPartitioned_dynamicframe = DynamicFrame.fromDF(GMBRouteStopPartitioned_dataframe, glueContext, "GMBRouteStopPartitioned_dynamicframe")

# Script generated for node GMB - Route Stop - Output
GMBRouteStopOutput_node1721240963859 = glueContext.write_dynamic_frame.from_options(frame=GMBRouteStopPartitioned_dynamicframe, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/' + args['updated_at'] + args['gmb_route_stop_s3_output_path'], "partitionKeys": []}, transformation_ctx="GMBRouteStopOutput_node1721240963859")

job.commit()