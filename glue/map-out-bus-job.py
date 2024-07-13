import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'map_out_database', 'citybus_route_table', 'citybus_stop_table', 'citybus_route_stop_table', 'kmb_route_table', 'kmb_stop_table', 'kmb_route_stop_table', 'citybus_route_s3_output_path', 'citybus_stop_s3_output_path', 'citybus_route_stop_s3_output_path', 'kmb_route_s3_output_path', 'kmb_stop_s3_output_path', 'kmb_route_stop_s3_output_path', 's3_output_bucket', 'updated_at'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Script generated for node Citybus Route Stop Source
CitybusRouteStopSource_node1720722340345 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['citybus_route_stop_table'], transformation_ctx="CitybusRouteStopSource_node1720722340345")

# Script generated for node Citybus Stop Source
CitybusStopSource_node1720721664195 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['citybus_stop_table'], transformation_ctx="CitybusStopSource_node1720721664195")

# Script generated for node KMB Route Stop Source
KMBRouteStopSource_node1720722659589 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['kmb_route_stop_table'], transformation_ctx="KMBRouteStopSource_node1720722659589")

# Script generated for node KMB Stop Source
KMBStopSource_node1720722561227 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['kmb_stop_table'], transformation_ctx="KMBStopSource_node1720722561227")

# Script generated for node KMB Route Source
KMBRouteSource_node1720722470940 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['kmb_route_table'], transformation_ctx="KMBRouteSource_node1720722470940")

# Script generated for node Citybus Route Source
CitybusRouteSource_node1720719425796 = glueContext.create_dynamic_frame.from_catalog(database=args['map_out_database'], table_name=args['citybus_route_table'], transformation_ctx="CitybusRouteSource_node1720719425796")

# Script generated for node Citybus Route Stop Output
CitybusRouteStopOutput_node1720722429935 = glueContext.write_dynamic_frame.from_options(frame=CitybusRouteStopSource_node1720722340345, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/bus/' + args['updated_at'] + args['citybus_route_stop_s3_output_path'], "partitionKeys": []}, transformation_ctx="CitybusRouteStopOutput_node1720722429935")

# Script generated for node Citybus Stop Output
CitybusStopOutput_node1720722288742 = glueContext.write_dynamic_frame.from_options(frame=CitybusStopSource_node1720721664195, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/bus/' + args['updated_at'] + args['citybus_stop_s3_output_path'], "partitionKeys": []}, transformation_ctx="CitybusStopOutput_node1720722288742")

# Script generated for node KMB Route Stop Output
KMBRouteStopOutput_node1720722716888 = glueContext.write_dynamic_frame.from_options(frame=KMBRouteStopSource_node1720722659589, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/bus/' + args['updated_at'] + args['kmb_route_stop_s3_output_path'], "partitionKeys": []}, transformation_ctx="KMBRouteStopOutput_node1720722716888")

# Script generated for node KMB Stop Output
KMBStopOutput_node1720722612250 = glueContext.write_dynamic_frame.from_options(frame=KMBStopSource_node1720722561227, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/bus/' + args['updated_at'] + args['kmb_stop_s3_output_path'], "partitionKeys": []}, transformation_ctx="KMBStopOutput_node1720722612250")

# Script generated for node KMB Route Output
KMBRouteOutput_node1720722520866 = glueContext.write_dynamic_frame.from_options(frame=KMBRouteSource_node1720722470940, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/bus/' + args['updated_at'] + args['kmb_route_s3_output_path'], "partitionKeys": []}, transformation_ctx="KMBRouteOutput_node1720722520866")

# Script generated for node Citybus Route Output
CitybusRouteOutput_node1720720085301 = glueContext.write_dynamic_frame.from_options(frame=CitybusRouteSource_node1720719425796, connection_type="s3", format="json", connection_options={"path": 's3://' + args['s3_output_bucket'] + '/bus/' + args['updated_at'] + args['citybus_route_s3_output_path'], "partitionKeys": []}, transformation_ctx="CitybusRouteOutput_node1720720085301")

job.commit()