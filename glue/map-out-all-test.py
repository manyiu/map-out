import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
import gs_flatten
from awsglue.dynamicframe import DynamicFrameCollection
import gs_array_to_cols
from awsglue.dynamicframe import DynamicFrame
from awsglue import DynamicFrame
import gs_split
from pyspark.sql import functions as SqlFuncs

# Script generated for node KMB Route Stop - routeSeq Mapping
def KmbRouteSeqTransform(glueContext, dfc) -> DynamicFrameCollection:
    df = dfc.select(list(dfc.keys())[0]).toDF()
    dyf = DynamicFrame.fromDF(df, glueContext)

    def MapRouteSeq(rec):
        if rec["routeSeq"] == "O":
            rec["routeSeq"] = 1
        elif rec["routeSeq"] == "I":
            rec["routeSeq"] = 2
        return rec
        
    mapped_dyf = Map.apply(frame = dyf, f = MapRouteSeq)
    new_dfc = DynamicFrameCollection({"KmbMappedRouteSeq": mapped_dyf}, glueContext)

    return new_dfc
def sparkUnion(glueContext, unionType, mapping, transformation_ctx) -> DynamicFrame:
    for alias, frame in mapping.items():
        frame.toDF().createOrReplaceTempView(alias)
    result = spark.sql("(select * from source1) UNION " + unionType + " (select * from source2)")
    return DynamicFrame.fromDF(result, glueContext, transformation_ctx)
# Script generated for node CityBus Route Stop - routesSeq Mapping
def CitybusRouteSeqTransform(glueContext, dfc) -> DynamicFrameCollection:
    df = dfc.select(list(dfc.keys())[0]).toDF()
    dyf = DynamicFrame.fromDF(df, glueContext)

    def MapRouteSeq(rec):
        if rec["routeSeq"] == "O":
            rec["routeSeq"] = 1
        elif rec["routeSeq"] == "I":
            rec["routeSeq"] = 2
        return rec
        
    mapped_dyf = Map.apply(frame = dyf, f = MapRouteSeq)
    new_dfc = DynamicFrameCollection({"CitybusMappedRouteSeq": mapped_dyf}, glueContext)

    return new_dfc
args = getResolvedOptions(sys.argv, ['JOB_NAME'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Script generated for node TD Bus - Source
TDBusSource_node1720534248111 = glueContext.create_dynamic_frame.from_catalog(database="map_out", table_name="map_out-td_routes_fares_geojson_bus", transformation_ctx="TDBusSource_node1720534248111")

# Script generated for node Citybus Route Stop - Source
CitybusRouteStopSource_node1720536590492 = glueContext.create_dynamic_frame.from_catalog(database="map_out", table_name="map_out-citybus_route_stop", transformation_ctx="CitybusRouteStopSource_node1720536590492")

# Script generated for node KMB Route Stop - Source
KMBRouteStopSource_node1720539010789 = glueContext.create_dynamic_frame.from_catalog(database="map_out", table_name="map_out-kmb_route_stop", transformation_ctx="KMBRouteStopSource_node1720539010789")

# Script generated for node TD Bus - Flatten
TDBusFlatten_node1720534345555 = TDBusSource_node1720534248111.gs_flatten(maxLevels=1)

# Script generated for node Citybus Route Stop - Change Schema
CitybusRouteStopChangeSchema_node1720536742724 = ApplyMapping.apply(frame=CitybusRouteStopSource_node1720536590492, mappings=[("route", "string", "routeName", "string"), ("dir", "string", "routeSeq", "string"), ("seq", "int", "stopSeq", "int"), ("stop", "string", "internalStopId", "string")], transformation_ctx="CitybusRouteStopChangeSchema_node1720536742724")

# Script generated for node KMB Route Stop - Change Schema
KMBRouteStopChangeSchema_node1720539059650 = ApplyMapping.apply(frame=KMBRouteStopSource_node1720539010789, mappings=[("route", "string", "routeName", "string"), ("bound", "string", "routeSeq", "string"), ("seq", "string", "stopSeq", "int"), ("stop", "string", "internalStopId", "string")], transformation_ctx="KMBRouteStopChangeSchema_node1720539059650")

# Script generated for node TD Bus - Split Coordinates
TDBusSplitCoordinates_node1720534377314 = TDBusFlatten_node1720534345555.gs_array_to_cols(colName="`geometry.coordinates`", colList="long,lat")

# Script generated for node CityBus Route Stop - routesSeq Mapping
CityBusRouteStoproutesSeqMapping_node1720537048742 = CitybusRouteSeqTransform(glueContext, DynamicFrameCollection({"CitybusRouteStopChangeSchema_node1720536742724": CitybusRouteStopChangeSchema_node1720536742724}, glueContext))

# Script generated for node KMB Route Stop - routeSeq Mapping
KMBRouteStoprouteSeqMapping_node1720539235624 = KmbRouteSeqTransform(glueContext, DynamicFrameCollection({"KMBRouteStopChangeSchema_node1720539059650": KMBRouteStopChangeSchema_node1720539059650}, glueContext))

# Script generated for node TD Bus - Split Company Code
TDBusSplitCompanyCode_node1720534472141 = TDBusSplitCoordinates_node1720534377314.gs_split(colName="`properties.companyCode`", pattern="\+", newColName="companyCodeArray")

# Script generated for node Citybus Route Stop - Select From Collection
CitybusRouteStopSelectFromCollection_node1720537752373 = SelectFromCollection.apply(dfc=CityBusRouteStoproutesSeqMapping_node1720537048742, key=list(CityBusRouteStoproutesSeqMapping_node1720537048742.keys())[0], transformation_ctx="CitybusRouteStopSelectFromCollection_node1720537752373")

# Script generated for node KMB Route Stop - Select From Collection
KMBRouteStopSelectFromCollection_node1720539389858 = SelectFromCollection.apply(dfc=KMBRouteStoprouteSeqMapping_node1720539235624, key=list(KMBRouteStoprouteSeqMapping_node1720539235624.keys())[0], transformation_ctx="KMBRouteStopSelectFromCollection_node1720539389858")

# Script generated for node TD Bus - Change Schema
TDBusChangeSchema_node1720538322261 = ApplyMapping.apply(frame=TDBusSplitCompanyCode_node1720534472141, mappings=[("`properties.routeId`", "int", "routeId", "int"), ("`properties.district`", "string", "district", "string"), ("`properties.routeNameC`", "string", "routeNameC", "string"), ("`properties.routeNameS`", "string", "routeNameS", "string"), ("`properties.routeNameE`", "string", "routeNameE", "string"), ("`properties.routeType`", "int", "routeType", "int"), ("`properties.serviceMode`", "string", "serviceMode", "string"), ("`properties.specialType`", "int", "specialType", "int"), ("`properties.journeyTime`", "int", "journeyTime", "int"), ("`properties.locStartNameC`", "string", "locStartNameC", "string"), ("`properties.locStartNameS`", "string", "locStartNameS", "string"), ("`properties.locStartNameE`", "string", "locStartNameE", "string"), ("`properties.locEndNameC`", "string", "locEndNameC", "string"), ("`properties.locEndNameS`", "string", "locEndNameS", "string"), ("`properties.locEndNameE`", "string", "locEndNameE", "string"), ("`properties.hyperlinkC`", "string", "hyperlinkC", "string"), ("`properties.hyperlinkS`", "string", "hyperlinkS", "string"), ("`properties.hyperlinkE`", "string", "hyperlinkE", "string"), ("`properties.fullFare`", "double", "fullFare", "double"), ("`properties.lastUpdateDate`", "string", "lastUpdateDate", "string"), ("`properties.routeSeq`", "int", "routeSeq", "int"), ("`properties.stopSeq`", "int", "stopSeq", "int"), ("`properties.stopId`", "int", "stopId", "int"), ("`properties.stopPickDrop`", "int", "stopPickDrop", "int"), ("`properties.stopNameC`", "string", "stopNameC", "string"), ("`properties.stopNameS`", "string", "stopNameS", "string"), ("`properties.stopNameE`", "string", "stopNameE", "string"), ("long", "double", "long", "double"), ("lat", "double", "lat", "double"), ("companyCodeArray", "array", "companyCode", "array")], transformation_ctx="TDBusChangeSchema_node1720538322261")

# Script generated for node TD Bus Route - Change Schema
TDBusRouteChangeSchema_node1720542935852 = ApplyMapping.apply(frame=TDBusChangeSchema_node1720538322261, mappings=[("routeId", "int", "routeId", "int"), ("district", "string", "district", "string"), ("routeNameC", "string", "routeNameC", "string"), ("routeNameS", "string", "routeNameS", "string"), ("routeNameE", "string", "routeNameE", "string"), ("routeType", "int", "routeType", "int"), ("serviceMode", "string", "serviceMode", "string"), ("specialType", "int", "specialType", "int"), ("journeyTime", "int", "journeyTime", "int"), ("locStartNameC", "string", "locStartNameC", "string"), ("locStartNameS", "string", "locStartNameS", "string"), ("locStartNameE", "string", "locStartNameE", "string"), ("locEndNameC", "string", "locEndNameC", "string"), ("locEndNameS", "string", "locEndNameS", "string"), ("locEndNameE", "string", "locEndNameE", "string"), ("hyperlinkC", "string", "hyperlinkC", "string"), ("hyperlinkS", "string", "hyperlinkS", "string"), ("hyperlinkE", "string", "hyperlinkE", "string"), ("fullFare", "double", "fullFare", "double"), ("routeSeq", "int", "routeSeq", "int"), ("companyCode", "array", "companyCode", "array")], transformation_ctx="TDBusRouteChangeSchema_node1720542935852")

# Script generated for node TD Route Stop - Change Schema
TDRouteStopChangeSchema_node1720539813687 = ApplyMapping.apply(frame=TDBusChangeSchema_node1720538322261, mappings=[("routeNameE", "string", "tdRouteName", "string"), ("routeSeq", "int", "tdRouteSeq", "int"), ("stopSeq", "int", "tdStopSeq", "int"), ("stopId", "int", "stopId", "int"), ("stopNameC", "string", "stopNameC", "string"), ("stopNameS", "string", "stopNameS", "string"), ("stopNameE", "string", "stopNameE", "string"), ("long", "double", "long", "double"), ("lat", "double", "lat", "double"), ("companyCode", "array", "companyCode", "array")], transformation_ctx="TDRouteStopChangeSchema_node1720539813687")

# Script generated for node Drop Duplicates
DropDuplicates_node1720543192866 =  DynamicFrame.fromDF(TDBusRouteChangeSchema_node1720542935852.toDF().dropDuplicates(["routeId"]), glueContext, "DropDuplicates_node1720543192866")

# Script generated for node KMB Route Stop - Join
KMBRouteStopJoin_node1720540080028 = Join.apply(frame1=KMBRouteStopSelectFromCollection_node1720539389858, frame2=TDRouteStopChangeSchema_node1720539813687, keys1=["routeName", "routeSeq", "stopSeq"], keys2=["tdRouteName", "tdRouteSeq", "tdStopSeq"], transformation_ctx="KMBRouteStopJoin_node1720540080028")

# Script generated for node Citybus Route Stop - Join
CitybusRouteStopJoin_node1720539994033 = Join.apply(frame1=CitybusRouteStopSelectFromCollection_node1720537752373, frame2=TDRouteStopChangeSchema_node1720539813687, keys1=["routeName", "routeSeq", "stopSeq"], keys2=["tdRouteName", "tdRouteSeq", "tdStopSeq"], transformation_ctx="CitybusRouteStopJoin_node1720539994033")

# Script generated for node KMB Stop
KMBStop_node1720540321115 = ApplyMapping.apply(frame=KMBRouteStopJoin_node1720540080028, mappings=[("internalStopId", "string", "internalStopId", "string"), ("stopId", "int", "stopId", "int"), ("stopNameC", "string", "stopNameC", "string"), ("stopNameS", "string", "stopNameS", "string"), ("stopNameE", "string", "stopNameE", "string"), ("long", "double", "long", "double"), ("lat", "double", "lat", "double"), ("companyCode", "array", "companyCode", "array")], transformation_ctx="KMBStop_node1720540321115")

# Script generated for node Citybus Stop
CitybusStop_node1720540231594 = ApplyMapping.apply(frame=CitybusRouteStopJoin_node1720539994033, mappings=[("internalStopId", "string", "internalStopId", "string"), ("stopId", "int", "stopId", "int"), ("stopNameC", "string", "stopNameC", "string"), ("stopNameS", "string", "stopNameS", "string"), ("stopNameE", "string", "stopNameE", "string"), ("long", "double", "long", "double"), ("lat", "double", "lat", "double"), ("companyCode", "array", "companyCode", "array")], transformation_ctx="CitybusStop_node1720540231594")

# Script generated for node KMB Stop - Drop Duplicates
KMBStopDropDuplicates_node1720540441600 =  DynamicFrame.fromDF(KMBStop_node1720540321115.toDF().dropDuplicates(["stopId"]), glueContext, "KMBStopDropDuplicates_node1720540441600")

# Script generated for node Citybus Stop - Drop Duplicates
CitybusStopDropDuplicates_node1720540392171 =  DynamicFrame.fromDF(CitybusStop_node1720540231594.toDF().dropDuplicates(["stopId"]), glueContext, "CitybusStopDropDuplicates_node1720540392171")

# Script generated for node Stop - Union
StopUnion_node1720540550909 = sparkUnion(glueContext, unionType = "ALL", mapping = {"source1": KMBStopDropDuplicates_node1720540441600, "source2": CitybusStopDropDuplicates_node1720540392171}, transformation_ctx = "StopUnion_node1720540550909")

# Script generated for node Amazon S3
AmazonS3_node1720541078188 = glueContext.write_dynamic_frame.from_options(frame=StopUnion_node1720540550909, connection_type="s3", format="json", connection_options={"path": "s3://mapoutstack-mapoutprocesseddatabucketd554bb76-7nbe9lolqdf2/stop/", "partitionKeys": []}, transformation_ctx="AmazonS3_node1720541078188")

job.commit()